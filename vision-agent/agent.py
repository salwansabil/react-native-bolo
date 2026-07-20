# /// script
# requires-python = ">=3.10,<3.14"
# dependencies = [
#   "python-dotenv>=1.2.2",
#   "vision-agents==0.6.6",
#   "vision-agents-plugins-getstream==0.6.6",
#   "vision-agents-plugins-openai==0.6.6",
# ]
# ///
import asyncio
import contextlib
import os
from pathlib import Path
from secrets import compare_digest
from typing import Annotated

from dotenv import dotenv_values
from fastapi import Header, HTTPException, status
from getstream.video.async_call import Call as StreamCall
from vision_agents.core import Agent, AgentLauncher, Runner, ServeOptions, User
from vision_agents.core.instructions import Instructions
from vision_agents.plugins import getstream, openai


SERVICE_DIR = Path(__file__).resolve().parent
ROOT_DIR = Path(__file__).resolve().parents[1]
INSTRUCTIONS_PATH = Path(__file__).with_name("prompts") / "teacher.md"
AGENT_USER_ID = "ai-language-teacher"
LIVE_CAPTION_EVENT_TYPE = "lesson.live_caption"


class CaptionedOpenAIRealtime(openai.Realtime):
    def __init__(self, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self._caption_call: StreamCall | None = None
        self._caption_queue: asyncio.Queue[dict[str, object]] = asyncio.Queue()
        self._caption_task: asyncio.Task[None] | None = None
        self._agent_caption_parts: dict[str, str] = {}
        self._user_caption_parts: dict[str, str] = {}

    def set_caption_call(self, call: StreamCall) -> None:
        self._caption_call = call

    def _queue_caption(
        self,
        *,
        caption_id: str,
        is_final: bool,
        speaker_id: str,
        text: str,
    ) -> None:
        if not text.strip() or self._caption_call is None:
            return

        self._caption_queue.put_nowait(
            {
                "caption_id": caption_id,
                "event_type": LIVE_CAPTION_EVENT_TYPE,
                "is_final": is_final,
                "speaker_id": speaker_id,
                "text": text.strip(),
            }
        )

        if self._caption_task is None or self._caption_task.done():
            self._caption_task = asyncio.create_task(self._send_captions())

    async def _send_captions(self) -> None:
        while not self._caption_queue.empty():
            caption = await self._caption_queue.get()
            try:
                if self._caption_call is not None:
                    await self._caption_call.send_call_event(
                        user_id=AGENT_USER_ID,
                        custom=caption,
                    )
            finally:
                self._caption_queue.task_done()

    async def _handle_openai_event(self, event: dict) -> None:
        event_type = event.get("type")

        if event_type in {
            "response.audio_transcript.delta",
            "response.output_audio_transcript.delta",
        }:
            caption_id = str(event.get("item_id") or event.get("response_id") or "agent")
            text = self._agent_caption_parts.get(caption_id, "") + str(event.get("delta") or "")
            self._agent_caption_parts[caption_id] = text
            self._queue_caption(
                caption_id=caption_id,
                is_final=False,
                speaker_id=AGENT_USER_ID,
                text=text,
            )
        elif event_type in {
            "response.audio_transcript.done",
            "response.output_audio_transcript.done",
        }:
            caption_id = str(event.get("item_id") or event.get("response_id") or "agent")
            text = str(event.get("transcript") or self._agent_caption_parts.get(caption_id, ""))
            self._queue_caption(
                caption_id=caption_id,
                is_final=True,
                speaker_id=AGENT_USER_ID,
                text=text,
            )
            self._agent_caption_parts.pop(caption_id, None)
        elif event_type == "conversation.item.input_audio_transcription.delta":
            caption_id = str(event.get("item_id") or "learner")
            text = self._user_caption_parts.get(caption_id, "") + str(event.get("delta") or "")
            self._user_caption_parts[caption_id] = text
            participant = self._current_participant
            self._queue_caption(
                caption_id=caption_id,
                is_final=False,
                speaker_id=participant.user_id if participant else "learner",
                text=text,
            )
        elif event_type == "conversation.item.input_audio_transcription.completed":
            caption_id = str(event.get("item_id") or "learner")
            text = str(event.get("transcript") or self._user_caption_parts.get(caption_id, ""))
            participant = self._current_participant
            self._queue_caption(
                caption_id=caption_id,
                is_final=True,
                speaker_id=participant.user_id if participant else "learner",
                text=text,
            )
            self._user_caption_parts.pop(caption_id, None)

        await super()._handle_openai_event(event)

    async def close(self) -> None:
        await super().close()
        if self._caption_task is not None:
            with contextlib.suppress(asyncio.CancelledError):
                await self._caption_task


def load_env_files() -> None:
    loaded_from_file: set[str] = set()
    for env_path in (
        ROOT_DIR / ".env",
        ROOT_DIR / ".env.local",
        SERVICE_DIR / ".env",
        SERVICE_DIR / ".env.local",
    ):
        for key, value in dotenv_values(env_path).items():
            if (
                value is not None
                and value.strip()
                and (key in loaded_from_file or not os.getenv(key))
            ):
                os.environ[key] = value
                loaded_from_file.add(key)


def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or not value.strip():
        env_paths = ", ".join(
            str(path)
            for path in (
                ROOT_DIR / ".env",
                ROOT_DIR / ".env.local",
                SERVICE_DIR / ".env",
                SERVICE_DIR / ".env.local",
            )
        )
        raise RuntimeError(
            f"Missing {name}. Add it to one of these local env files: {env_paths}."
        )

    return value


load_env_files()


def validate_agent_env() -> None:
    get_required_env("STREAM_API_KEY")
    get_required_env("STREAM_API_SECRET")
    get_required_env("OPENAI_API_KEY")
    get_required_env("VISION_AGENT_SERVICE_TOKEN")


async def require_service_token(
    call_id: str,
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    del call_id
    expected_token = get_required_env("VISION_AGENT_SERVICE_TOKEN")
    scheme, _, supplied_token = (authorization or "").partition(" ")

    if scheme.lower() != "bearer" or not compare_digest(supplied_token, expected_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Vision Agent service token",
        )


def get_selected_language(**kwargs: object) -> str:
    value = kwargs.get("selected_language") or os.getenv("TEACHER_TARGET_LANGUAGE")
    if isinstance(value, str) and value.strip():
        return value.strip()

    return "Spanish"


def get_text(value: object, fallback: str = "") -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()

    return fallback


def get_dict(value: object) -> dict[str, object]:
    if isinstance(value, dict):
        return value

    return {}


def get_list(value: object) -> list[object]:
    if isinstance(value, list):
        return value

    return []


def format_lines(items: list[object], formatter) -> str:
    lines = [formatter(get_dict(item)) for item in items]
    return "\n".join(f"- {line}" for line in lines if line)


def build_instructions(
    selected_language: str,
    lesson_context: dict[str, object] | None = None,
) -> str:
    context = lesson_context or {}
    language = get_dict(context.get("language"))
    lesson = get_dict(context.get("lesson"))
    ai_teacher_prompt = get_dict(context.get("ai_teacher_prompt"))
    goals = get_list(context.get("goals"))
    vocabulary = get_list(context.get("vocabulary"))
    phrases = get_list(context.get("phrases"))

    language_name = get_text(language.get("name"), selected_language)
    teacher_name = get_text(language.get("ai_teacher_name"), "AI Teacher")
    lesson_title = get_text(lesson.get("title"), "the selected lesson")
    system_prompt = get_text(ai_teacher_prompt.get("systemPrompt"))
    persona = get_text(ai_teacher_prompt.get("persona"))
    correction_style = get_text(ai_teacher_prompt.get("correctionStyle"))
    opening_line = get_text(ai_teacher_prompt.get("openingLine"))
    practice_instructions = get_list(ai_teacher_prompt.get("practiceInstructions"))

    base_instructions = (
        f"Read @{INSTRUCTIONS_PATH}\n\n"
        f"The learner selected {language_name}. "
        "Always speak English. Teach the selected language through English."
    )

    if not context:
        return base_instructions

    lesson_details = [
        base_instructions,
        "\n## Current lesson context",
        f"Language: {language_name}",
        f"Teacher name: {teacher_name}",
        f"Lesson: {lesson_title}",
        f"Lesson description: {get_text(lesson.get('description'))}",
        "If you introduce yourself, use the teacher name above.",
    ]

    if persona:
        lesson_details.append(f"Teacher persona: {persona}")
    if system_prompt:
        lesson_details.append(f"Lesson system prompt: {system_prompt}")
    if correction_style:
        lesson_details.append(f"Correction style: {correction_style}")
    if opening_line:
        lesson_details.append(f"Opening line: {opening_line}")

    formatted_goals = format_lines(goals, lambda item: get_text(item.get("text")))
    if formatted_goals:
        lesson_details.append(f"\nGoals:\n{formatted_goals}")

    formatted_vocabulary = format_lines(
        vocabulary,
        lambda item: (
            f"{get_text(item.get('term'))} = {get_text(item.get('translation'))}. "
            f"Pronunciation: {get_text(item.get('pronunciation'))}. "
            f"Example: {get_text(item.get('example'))}"
        ).strip(),
    )
    if formatted_vocabulary:
        lesson_details.append(f"\nVocabulary:\n{formatted_vocabulary}")

    formatted_phrases = format_lines(
        phrases,
        lambda item: (
            f"{get_text(item.get('text'))} = {get_text(item.get('translation'))}. "
            f"Pronunciation: {get_text(item.get('pronunciation'))}. "
            f"Context: {get_text(item.get('context'))}"
        ).strip(),
    )
    if formatted_phrases:
        lesson_details.append(f"\nPhrases:\n{formatted_phrases}")

    formatted_practice = "\n".join(
        f"- {instruction}"
        for instruction in (get_text(item) for item in practice_instructions)
        if instruction
    )
    if formatted_practice:
        lesson_details.append(f"\nPractice plan:\n{formatted_practice}")

    lesson_details.append(
        "\nUse this context to guide the live audio lesson. Keep turns short, "
        "friendly, and beginner-safe. Ask the learner to repeat one phrase at a time. "
        "When teaching a word or phrase, sound it out using the provided pronunciation guide. "
        "HIGHEST-PRIORITY PRONUNCIATION RULE: understanding is the pass condition. If you can "
        "understand the learner's sentence or intended phrase, accept it as successful, give brief "
        "encouragement, and continue to the next part of the lesson immediately. Do not correct "
        "pronunciation or request the same sentence again after you understood it, even if sounds, "
        "stress, rhythm, grammar, or accent were imperfect. Ask for a repeat only when you genuinely "
        "cannot determine the intended sentence or phrase. This rule overrides any earlier system "
        "prompt, correction style, or practice instruction that suggests repeating after an "
        "understandable response. If a retry is necessary, correct only the most important sound "
        "and request one more attempt; do not create repetitive correction loops. "
        "SPOKEN-LANGUAGE RULE: converse like a warm human teacher and never expose internal lesson "
        "or evaluation terminology. Never say phrases such as 'tiny model', 'model phrase', "
        "'target phrase', 'this matches the phrase', 'your response matches', 'lesson content', or "
        "'practice plan'. Do not explain that an answer matched stored material or narrate your "
        "teaching process. Respond naturally with brief, varied encouragement and flow directly "
        "into the next conversational question or activity. "
        "After every question or repeat prompt, stop speaking and wait for the "
        "learner's response before continuing."
    )

    return "\n".join(lesson_details)


def get_lesson_context(call_custom_data: object) -> dict[str, object]:
    if not isinstance(call_custom_data, dict):
        return {}

    return get_dict(call_custom_data.get("lesson_context"))


def get_opening_instruction(lesson_context: dict[str, object]) -> str:
    ai_teacher_prompt = get_dict(lesson_context.get("ai_teacher_prompt"))
    opening_line = get_text(ai_teacher_prompt.get("openingLine"))

    if opening_line:
        return (
            f"Give a warm, energetic one-sentence greeting, then use this opening: {opening_line} "
            "Speak in one or two short conversational sentences total. Include one clear "
            "target-language example with its English meaning and pronunciation sound-out, ask "
            "the learner to repeat or answer, then stop speaking and wait for their response."
        )

    return (
        "Give a warm, energetic one-sentence greeting and ask what they want to practice first. "
        "Then stop speaking and wait for their response."
    )


def apply_lesson_context(agent: Agent, lesson_context: dict[str, object]) -> None:
    language = get_dict(lesson_context.get("language"))
    selected_language = get_text(language.get("name"), get_selected_language())
    instructions = Instructions(
        input_text=build_instructions(selected_language, lesson_context)
    )

    agent.instructions = instructions

    set_instructions = getattr(agent.llm, "set_instructions", None)
    if callable(set_instructions):
        set_instructions(instructions)


async def create_agent(**kwargs: object) -> Agent:
    validate_agent_env()
    selected_language = get_selected_language(**kwargs)

    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name="AI Language Teacher", id=AGENT_USER_ID),
        instructions=build_instructions(selected_language),
        llm=CaptionedOpenAIRealtime(
            model=os.getenv("OPENAI_REALTIME_MODEL", "gpt-realtime-2"),
            api_key=get_required_env("OPENAI_API_KEY"),
            voice=os.getenv("OPENAI_REALTIME_VOICE", "marin"),
            send_video=False,
        ),
    )


async def join_call(
    agent: Agent,
    call_type: str,
    call_id: str,
    **kwargs: object,
) -> None:
    call = await agent.create_call(call_type, call_id)
    await call.get()
    if isinstance(agent.llm, CaptionedOpenAIRealtime):
        agent.llm.set_caption_call(call)
    lesson_context = get_lesson_context(call.custom_data)
    apply_lesson_context(agent, lesson_context)

    async with agent.join(call):
        await agent.simple_response(get_opening_instruction(lesson_context))
        await agent.finish()


runner = Runner(
    AgentLauncher(create_agent=create_agent, join_call=join_call),
    serve_options=ServeOptions(
        can_start_session=require_service_token,
        can_close_session=require_service_token,
        can_view_session=require_service_token,
        can_view_metrics=require_service_token,
    ),
)


if __name__ == "__main__":
    runner.cli()
