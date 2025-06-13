import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { ThemedView } from '@/components/ui/ThemedView';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { View, Text, TextInput, Button, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';

function MyForm() {
  const { control, handleSubmit, formState: { errors } } = useForm();
  const [submittedData, setSubmittedData] = useState<{ name: string; email: string } | null>(null);

  const onSubmit = (data) => {
    console.log('Submitted Data:', data);
    setSubmittedData(data);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ThemedView style={styles.container}>
          {/* Form Inputs */}
          <Controller
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Your Name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
            name="name"
            rules={{ required: 'You must enter your name' }}
          />
          {errors.name?.message && <Text style={styles.errorText}>{String(errors.name.message)}</Text>}

          <Controller
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
            name="email"
            rules={{
              required: 'You must enter your email',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Enter a valid email address',
              },
            }}
          />
          {errors.email && <Text style={styles.errorText}>{String(errors.email.message)}</Text>}

          {/* Submit Button */}
          <Button title="Submit" onPress={handleSubmit(onSubmit)} />

          {/* Submitted Data */}
          {submittedData && (
            <ThemedView style={styles.submittedContainer}>
              <ThemedText style={styles.submittedTitle}>Submitted Data:</ThemedText>
              <ThemedText>Name: {submittedData.name}</ThemedText>
              <ThemedText>Email: {submittedData.email}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    padding: 8,
    borderRadius: 4,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 12,
  },
  submittedContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 4,
  },
  submittedTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default MyForm;