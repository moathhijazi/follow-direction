import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { useAuth } from "@/hooks/use-auth";
import { useSnackbar } from "@/providers/snackbar-provider";

// Updated Zod Schema with email
const loginSchema = z.object({
  email: z
    .string("يرجى إدخال بريد إلكتروني صحيح")
    .min(1, "البريد الإلكتروني مطلوب"),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة")
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const { showSnackbar } = useSnackbar();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data).then((res) => {
      if (!res.success) {
        if (res.error === "Invalid login credentials") {
          showSnackbar("بيانات الدخول غير صحيحة");
          return;
        }
        showSnackbar("حدث خطأ أثناء تسجيل الدخول");
        return;
      }
      router.replace("/(admin)/(dashboard)");
    });
  };

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="h-full flex justify-center items-center p-6">
        <View className=" w-full p-4 rounded-2xl">
          <Text className="text-2xl font-semi-bold text-center my-6">
            تسجيل الدخول
          </Text>

          {/* Email Field */}
          <View className="my-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  mode="outlined"
                  label="البريد الإلكتروني"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.email}
                  textAlign="right"
                  className="bg-white"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  outlineColor="#e5e7eb" // Adds border color
                  activeOutlineColor="#3b82f6" // Active border color
                  theme={{ roundness: 8 }} // Ensures rounded corners
                  left={
                    <TextInput.Icon
                      icon="email"
                      color={errors.email ? "#ef4444" : "#6b7280"}
                    />
                  }
                />
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-sm mt-1 text-right">
                {errors.email.message}
              </Text>
            )}
          </View>

          {/* Password Field */}
          <View className="my-4">
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  mode="outlined"
                  label="كلمة المرور"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.password}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                  className="bg-white"
                  outlineColor="#e5e7eb"
                  activeOutlineColor="#3b82f6"
                  theme={{ roundness: 8 }}
                  left={
                    <TextInput.Icon
                      icon="lock"
                      color={errors.password ? "#ef4444" : "#6b7280"}
                    />
                  }
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                      color="#6b7280"
                    />
                  }
                />
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-sm mt-1 text-right">
                {errors.password.message}
              </Text>
            )}
          </View>

          {/* Login Button */}
          <View className="my-4">
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              className="rounded-lg"
              contentStyle={{ height: 48 }}
            >
              {isSubmitting ? "جاري التسجيل..." : "تسجيل الدخول"}
            </Button>
          </View>
        </View>

        <Button
          mode="text"
          icon="arrow-left"
          className="mt-6"
          onPress={() => router.back()}
        >
          العودة للرئيسية
        </Button>
      </View>
    </SafeAreaView>
  );
}
