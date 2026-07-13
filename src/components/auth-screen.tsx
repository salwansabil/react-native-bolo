import { isClerkAPIResponseError, useSignIn, useSignUp, useSSO } from "@clerk/expo";
import { posthog } from "@/config/posthog";
import { images } from "@/constants/images";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AuthScreenProps = {
  mode: "sign-up" | "sign-in";
};

const verificationCodeLength = 6;
type SocialStrategy = "oauth_google" | "oauth_facebook" | "oauth_apple";

export function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const {
    signIn,
    fetchStatus: signInFetchStatus,
  } = useSignIn();
  const {
    signUp,
    fetchStatus: signUpFetchStatus,
  } = useSignUp();
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSocialStrategy, setActiveSocialStrategy] = useState<SocialStrategy | null>(
    null,
  );
  const [authError, setAuthError] = useState("");
  const inputRef = useRef<TextInput>(null);

  const isSignUp = mode === "sign-up";
  const isFetching =
    isSubmitting ||
    activeSocialStrategy !== null ||
    (isSignUp ? signUpFetchStatus === "fetching" : signInFetchStatus === "fetching");
  const title = isSignUp ? "Create your account" : "Welcome back";
  const subtitle = isSignUp
    ? "Start your language journey today ✨"
    : "Continue your language journey today ✨";
  const primaryLabel = isSignUp ? "Sign Up" : "Sign In";
  const footerCopy = isSignUp
    ? "Already have an account?"
    : "Don't have an account?";
  const footerAction = isSignUp ? "Log in" : "Sign up";
  const footerRoute = isSignUp ? "/sign-in" : "/sign-up";
  const canSubmit =
    emailAddress.trim().length > 0 && (!isSignUp || password.length > 0);

  const getClerkResultErrorMessage = (
    error: { longMessage?: string; message?: string } | null,
  ) => error?.longMessage ?? error?.message ?? "";

  const getErrorMessage = (error: unknown) => {
    if (isClerkAPIResponseError(error)) {
      return error.errors[0]?.longMessage ?? error.errors[0]?.message ?? "Please try again.";
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Something went wrong. Please try again.";
  };

  const openVerificationModal = () => {
    setVerificationCode("");
    setIsVerificationVisible(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handlePrimaryPress = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    setAuthError("");
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        posthog.capture("sign_up_submitted", { method: "email" });

        const signUpResult = await signUp.password({
          emailAddress: emailAddress.trim(),
          password,
        });
        const signUpError = getClerkResultErrorMessage(signUpResult.error);

        if (signUpError) {
          setAuthError(signUpError);
          posthog.capture("auth_error_occurred", { mode: "sign_up", method: "email", error: signUpError });
          return;
        }

        const emailCodeResult = await signUp.verifications.sendEmailCode();
        const emailCodeError = getClerkResultErrorMessage(emailCodeResult.error);

        if (emailCodeError) {
          setAuthError(emailCodeError);
          posthog.capture("auth_error_occurred", { mode: "sign_up", method: "email", error: emailCodeError });
          return;
        }

        openVerificationModal();
        return;
      }

      posthog.capture("sign_in_submitted", { method: "email" });

      const signInResult = await signIn.emailCode.sendCode({
        emailAddress: emailAddress.trim(),
      });
      const signInError = getClerkResultErrorMessage(signInResult.error);

      if (signInError) {
        setAuthError(signInError);
        posthog.capture("auth_error_occurred", { mode: "sign_in", method: "email", error: signInError });
        return;
      }

      openVerificationModal();
    } catch (error) {
      const msg = getErrorMessage(error);
      setAuthError(msg);
      posthog.captureException(error instanceof Error ? error : new Error(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationChange = async (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, verificationCodeLength);

    setVerificationCode(digitsOnly);
    setAuthError("");

    if (digitsOnly.length === verificationCodeLength) {
      setIsSubmitting(true);

      try {
        if (isSignUp) {
          const verifySignUpResult = await signUp.verifications.verifyEmailCode({
            code: digitsOnly,
          });
          const verifySignUpError = getClerkResultErrorMessage(verifySignUpResult.error);

          if (verifySignUpError) {
            setAuthError(verifySignUpError);
            posthog.capture("auth_error_occurred", { mode: "sign_up", step: "verification", error: verifySignUpError });
            return;
          }

          if (signUp.status === "complete") {
            const finalizeResult = await signUp.finalize();
            const finalizeError = getClerkResultErrorMessage(finalizeResult.error);

            if (finalizeError) {
              setAuthError(finalizeError);
              posthog.capture("auth_error_occurred", { mode: "sign_up", step: "finalize", error: finalizeError });
              return;
            }

            posthog.capture("sign_up_completed", { method: "email" });
            setIsVerificationVisible(false);
            router.replace("/");
            return;
          }

          setAuthError("Sign up is not complete yet. Please try again.");
          return;
        }

        const verifySignInResult = await signIn.emailCode.verifyCode({
          code: digitsOnly,
        });
        const verifySignInError = getClerkResultErrorMessage(verifySignInResult.error);

        if (verifySignInError) {
          setAuthError(verifySignInError);
          posthog.capture("auth_error_occurred", { mode: "sign_in", step: "verification", error: verifySignInError });
          return;
        }

        if (signIn.status === "complete") {
          const finalizeResult = await signIn.finalize();
          const finalizeError = getClerkResultErrorMessage(finalizeResult.error);

          if (finalizeError) {
            setAuthError(finalizeError);
            posthog.capture("auth_error_occurred", { mode: "sign_in", step: "finalize", error: finalizeError });
            return;
          }

          posthog.capture("sign_in_completed", { method: "email" });
          setIsVerificationVisible(false);
          router.replace("/");
          return;
        }

        setAuthError("Sign in is not complete yet. Please try again.");
      } catch (error) {
        setVerificationCode("");
        const msg = getErrorMessage(error);
        setAuthError(msg);
        posthog.captureException(error instanceof Error ? error : new Error(msg));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSocialPress = async (strategy: SocialStrategy) => {
    if (isFetching) {
      return;
    }

    setAuthError("");
    setActiveSocialStrategy(strategy);

    const eventName = isSignUp ? "sign_up_social_initiated" : "sign_in_social_initiated";
    posthog.capture(eventName, { strategy });

    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy });

      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
        const completedEvent = isSignUp ? "sign_up_completed" : "sign_in_completed";
        posthog.capture(completedEvent, { method: strategy });
        router.replace("/");
      }
    } catch (error) {
      const msg = getErrorMessage(error);
      setAuthError(msg);
      posthog.capture("auth_error_occurred", { mode: isSignUp ? "sign_up" : "sign_in", method: strategy, error: msg });
      posthog.captureException(error instanceof Error ? error : new Error(msg));
    } finally {
      setActiveSocialStrategy(null);
    }
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/onboarding");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={0.72}
          onPress={handleBackPress}
          style={styles.backButton}
        >
          <Text className="font-poppins text-[44px] leading-[44px] text-[#020735]">
            ‹
          </Text>
        </TouchableOpacity>

        <View className="mt-[41px]">
          <Text className="font-poppins-bold text-[37px] leading-[45px] text-[#020735]">
            {title}
          </Text>
          <Text className="mt-5 font-poppins text-[22px] leading-[28px] text-[#6E728F]">
            {subtitle}
          </Text>
        </View>

        <View className="items-center">
          <Image
            source={images.mascotAuth}
            className="-mb-[12px] mt-[18px] h-[192px] w-[268px]"
            resizeMode="contain"
          />
        </View>

        <View className="gap-5">
          <View className="rounded-[21px] border border-[#EBEDF3] bg-white px-6 py-[18px]">
            <Text className="font-poppins-semibold text-[16px] leading-[20px] text-[#7B7F9E]">
              Email
            </Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmailAddress}
              placeholder="alex@gmail.com"
              placeholderTextColor="rgba(2, 7, 53, 0.42)"
              style={styles.fieldInput}
              underlineColorAndroid="transparent"
              value={emailAddress}
            />
          </View>

          {isSignUp ? (
            <View className="rounded-[21px] border border-[#EBEDF3] bg-white px-6 py-[18px]">
              <Text className="font-poppins-semibold text-[16px] leading-[20px] text-[#7B7F9E]">
                Password
              </Text>
              <View className="flex-row items-center gap-3">
                <TextInput
                  placeholder="•••••••••"
                  placeholderTextColor="rgba(2, 7, 53, 0.42)"
                  secureTextEntry={!isPasswordVisible}
                  onChangeText={setPassword}
                  style={[styles.fieldInput, styles.passwordInput]}
                  underlineColorAndroid="transparent"
                  value={password}
                />
                <EyeIcon
                  isVisible={isPasswordVisible}
                  onPress={() => setIsPasswordVisible((prev) => !prev)}
                />
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.82}
            disabled={!canSubmit || isFetching}
            onPress={handlePrimaryPress}
            style={[
              styles.primaryButton,
              (!canSubmit || isFetching) && styles.primaryButtonDisabled,
            ]}
          >
            {isFetching && !isVerificationVisible ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-center font-poppins-semibold text-[25px] leading-[31px] text-white">
                {primaryLabel}
              </Text>
            )}
          </TouchableOpacity>
          {authError ? (
            <Text className="text-center font-poppins-medium text-[14px] leading-[21px] text-[#FF4D4F]">
              {authError}
            </Text>
          ) : null}

          {isSignUp ? <View nativeID="clerk-captcha" /> : null}
        </View>

        <View className="my-[25px] flex-row items-center gap-6">
          <View className="h-px flex-1 bg-[#E8EAF0]" />
          <Text className="font-poppins text-[19px] leading-[24px] text-[#777B97]">
            or continue with
          </Text>
          <View className="h-px flex-1 bg-[#E8EAF0]" />
        </View>

        <View className="gap-[13px]">
          <SocialAuthButton
            isLoading={activeSocialStrategy === "oauth_google"}
            icon="G"
            iconColor="#4285F4"
            label="Continue with Google"
            onPress={() => void handleSocialPress("oauth_google")}
          />
          <SocialAuthButton
            isLoading={activeSocialStrategy === "oauth_facebook"}
            icon="f"
            iconColor="#1877F2"
            label="Continue with Facebook"
            onPress={() => void handleSocialPress("oauth_facebook")}
          />
          <SocialAuthButton
            isLoading={activeSocialStrategy === "oauth_apple"}
            icon=""
            iconColor="#020735"
            label="Continue with Apple"
            onPress={() => void handleSocialPress("oauth_apple")}
          />
        </View>

        <View className="mt-auto pt-[86px]">
          <Text className="text-center font-poppins text-[19px] leading-[25px] text-[#777B97]">
            {footerCopy}{" "}
            <Text
              className="font-poppins-semibold text-[#5A32FF]"
              onPress={() => router.replace(footerRoute)}
            >
              {footerAction}
            </Text>
          </Text>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsVerificationVisible(false)}
        transparent
        visible={isVerificationVisible}
      >
        <KeyboardAvoidingView
          behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
          style={styles.modalKeyboardView}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text className="text-center font-poppins-bold text-[26px] leading-[32px] text-[#020735]">
                Check your email
              </Text>
              <Text className="mt-3 text-center font-poppins text-[16px] leading-[25px] text-[#6E728F]">
                Enter the 6-digit verification code sent to {emailAddress}.
              </Text>

              <TouchableOpacity
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
                style={styles.codeRow}
              >
                {Array.from({ length: verificationCodeLength }).map((_, index) => (
                  <View key={index} style={styles.codeBox}>
                    <Text className="font-poppins-semibold text-[23px] leading-[29px] text-[#020735]">
                      {verificationCode[index] ?? ""}
                    </Text>
                  </View>
                ))}
              </TouchableOpacity>

              <TextInput
                ref={inputRef}
                autoFocus
                editable={!isSubmitting}
                keyboardType="number-pad"
                maxLength={verificationCodeLength}
                onChangeText={(value) => void handleVerificationChange(value)}
                style={styles.hiddenCodeInput}
                textContentType="oneTimeCode"
                value={verificationCode}
              />

              {isSubmitting ? (
                <ActivityIndicator color="#6A45F6" style={styles.modalLoader} />
              ) : null}

              {authError ? (
                <Text className="mt-4 text-center font-poppins-medium text-[14px] leading-[21px] text-[#FF4D4F]">
                  {authError}
                </Text>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

type SocialAuthButtonProps = {
  icon: string;
  iconColor: string;
  isLoading: boolean;
  label: string;
  onPress: () => void;
};

function SocialAuthButton({
  icon,
  iconColor,
  isLoading,
  label,
  onPress,
}: SocialAuthButtonProps) {
  return (
    <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={styles.socialButton}>
      {isLoading ? (
        <View className="w-[52px] items-center">
          <ActivityIndicator color={iconColor} />
        </View>
      ) : (
        <Text
          className="w-[52px] text-center font-poppins-bold text-[32px] leading-[36px]"
          style={{ color: iconColor }}
        >
          {icon}
        </Text>
      )}
      <Text className="flex-1 font-poppins-medium text-[20px] leading-[25px] text-[#020735]">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function EyeIcon({
  isVisible,
  onPress,
}: {
  isVisible: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.eyeButton}>
      <View
        style={[styles.eyeIcon, isVisible ? styles.eyeIconVisible : styles.eyeIconHidden]}
      >
        <View
          style={[
            styles.eyePupil,
            isVisible ? styles.eyePupilVisible : styles.eyePupilHidden,
          ]}
        />
        {!isVisible ? <View style={styles.eyeSlash} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 44,
    paddingBottom: 45,
    paddingTop: 24,
  },
  backButton: {
    alignItems: "flex-start",
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  fieldInput: {
    color: "#020735",
    fontFamily: "Poppins-Regular",
    fontSize: 20,
    lineHeight: 26,
    marginTop: 12,
    padding: 0,
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    position: "relative",
    transform: [{ scaleX: 1.45 }, { rotate: "-2deg" }],
    width: 22,
  },
  eyeIconHidden: {
    borderColor: "#737895",
  },
  eyeIconVisible: {
    borderColor: "#6A45F6",
  },
  eyePupil: {
    borderRadius: 5,
    height: 8,
    transform: [{ scaleX: 0.7 }],
    width: 8,
  },
  eyePupilHidden: {
    backgroundColor: "#737895",
  },
  eyePupilVisible: {
    backgroundColor: "#6A45F6",
  },
  eyeSlash: {
    backgroundColor: "#FFFFFF",
    height: 2,
    left: 1,
    position: "absolute",
    transform: [{ rotate: "-35deg" }],
    width: 18,
  },
  primaryButton: {
    backgroundColor: "#6A45F6",
    borderCurve: "continuous",
    borderRadius: 17,
    paddingVertical: 22,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  socialButton: {
    alignItems: "center",
    borderColor: "#EFF0F5",
    borderCurve: "continuous",
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 76,
    paddingHorizontal: 31,
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(2, 7, 53, 0.36)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderCurve: "continuous",
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 28,
    width: "100%",
  },
  codeRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 24,
  },
  codeBox: {
    alignItems: "center",
    borderColor: "#E5E7EF",
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 44,
  },
  hiddenCodeInput: {
    height: 1,
    opacity: 0,
    position: "absolute",
    width: 1,
  },
  modalLoader: {
    marginTop: 18,
  },
});
