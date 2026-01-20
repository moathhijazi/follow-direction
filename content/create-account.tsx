import { supabase } from "@/lib/supabase";
import { useModal } from "@/providers/modal-provider";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { Button, IconButton, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateAccountContent() {
  const { close } = useModal();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<null | string>(null);
  const [success, setSuccess] = useState<null | string>(null);

  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
      setError("جميع الحقول مطلوبة");
      return false;
    }

    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return false;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون على الأقل 6 أحرف");
      return false;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("البريد الإلكتروني غير صالح");
      return false;
    }

    if (username.length < 3) {
      setError("اسم المستخدم يجب أن يكون على الأقل 3 أحرف");
      return false;
    }

    return true;
  };

  const onSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: username.trim(),
            },
          },
        },
      );

      if (signUpError) {
        // Handle specific Supabase errors
        if (signUpError.message.includes("already registered")) {
          setError("هذا البريد الإلكتروني مسجل بالفعل");
        } else if (signUpError.message.includes("invalid email")) {
          setError("البريد الإلكتروني غير صالح");
        } else if (signUpError.message.includes("password")) {
          setError("كلمة المرور غير صالحة");
        } else {
          setError(`حدث خطأ: ${signUpError.message}`);
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Optionally, update the profiles table with additional user info
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          full_name: username.trim(),
        });

        if (profileError) {
          console.error("Error updating profile:", profileError);
          // Continue anyway since auth succeeded
        }

        setSuccess(
          "تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.",
        );

        router.replace("/");

        // Reset form after successful submission
        setTimeout(() => {
          setUsername("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setSuccess(null);
          close();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setError(null);
    setSuccess(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setError(null);
    setSuccess(null);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    setError(null);
    setSuccess(null);
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    setError(null);
    setSuccess(null);
  };

  return (
    <SafeAreaView>
      <View className="w-full flex flex-row items-center">
        <IconButton icon={"close"} onPress={close} />
        <Text className="font-semi-bold">انشاء حساب جديد</Text>
      </View>

      <View className="p-6 gap-y-4">
        {/* Error Message */}
        {error && (
          <View className="bg-red-100 p-3 rounded-lg">
            <Text className="text-red-700 text-center font-reg">{error}</Text>
          </View>
        )}

        {/* Success Message */}
        {success && (
          <View className="bg-green-100 p-3 rounded-lg">
            <Text className="text-green-700 text-center font-reg">
              {success}
            </Text>
          </View>
        )}

        <View>
          <TextInput
            value={username}
            onChangeText={handleUsernameChange}
            mode="outlined"
            label="اسم المستخدم"
            autoCapitalize="words"
            disabled={loading}
          />
        </View>
        <View>
          <TextInput
            value={email}
            onChangeText={handleEmailChange}
            mode="outlined"
            label="البريد الالكتروني"
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={loading}
          />
        </View>
        <View>
          <TextInput
            value={password}
            onChangeText={handlePasswordChange}
            mode="outlined"
            label="كلمة المرور"
            secureTextEntry
            disabled={loading}
          />
        </View>
        <View>
          <TextInput
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            mode="outlined"
            label="تأكيد كلمة المرور"
            secureTextEntry
            disabled={loading}
            onSubmitEditing={onSubmit}
          />
        </View>
        <View>
          <Button
            mode="contained"
            onPress={onSubmit}
            loading={loading}
            disabled={loading}
          >
            انشاء الحساب
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
