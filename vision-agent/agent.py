# /// script
# requires-python = ">=3.10,<3.14"
# dependencies = [
#   "python-dotenv>=1.2.2",
#   "vision-agents==0.6.6",
#   "vision-agents-plugins-getstream==0.6.6",
#   "vision-agents-plugins-openai==0.6.6",
# ]
# ///
import os
from pathlib import Path

from dotenv import dotenv_values
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.core.instructions import Instructions
from vision_agents.plugins import getstream, openai


SERVICE_DIR = Path(__file__).resolve().parent
ROOT_DIR = Path(__file__).resolve().parents[1]
INSTRUCTIONS_PATH = Path(__file__).with_name("prompts") / "teacher.md"
AGENT_USER_ID = "ai-language-teacher"


def load_env_files() -> None:
    loaded_from_file: set[str] = set()
    for env_path in (ROOT_DIR / ".env", SERVICE_DIR / ".env"):
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
        raise RuntimeError(
            f"Missing {name}. Add it to {ROOT_DIR / '.env'} "
            f"or {SERVICE_DIR / '.env'}."
        )

    return value


load_env_files()


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
        f"Lesson: {lesson_title}",
        f"Lesson description: {get_text(lesson.get('description'))}",
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
            f"Example: {get_text(item.get('example'))}"
        ).strip(),
    )
    if formatted_vocabulary:
        lesson_details.append(f"\nVocabulary:\n{formatted_vocabulary}")

    formatted_phrases = format_lines(
        phrases,
        lambda item: (
            f"{get_text(item.get('text'))} = {get_text(item.get('translation'))}. "
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
        "friendly, and beginner-safe. Ask the learner to repeat one phrase at a time."
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
        return f"Greet the learner briefly, then say: {opening_line}"

    return "Greet the learner briefly and ask what they want to practice first."


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
    selected_language = get_selected_language(**kwargs)

    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name="AI Language Teacher", id=AGENT_USER_ID),
        instructions=build_instructions(selected_language),
        llm=openai.Realtime(
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
    lesson_context = get_lesson_context(call.custom_data)
    apply_lesson_context(agent, lesson_context)

    async with agent.join(call):
        await agent.simple_response(get_opening_instruction(lesson_context))
        await agent.finish()


runner = Runner(AgentLauncher(create_agent=create_agent, join_call=join_call))


if __name__ == "__main__":
    runner.cli()
