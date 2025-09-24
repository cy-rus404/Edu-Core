import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { supabase } from './supabase';
import { normalize, getResponsiveWidth, getResponsiveHeight, responsiveScreenFontSize } from './responsive';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    
    // Only allow specific admin credentials
    if (role === "admin") {
      if (email === "admin@educore.com" && password === "admin123") {
        onLogin("admin", "admin");
      } else {
        Alert.alert("Error", "Invalid admin credentials");
      }
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      const username = email.split('@')[0];
      onLogin(username, role);
    }
    
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Welcome Back</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={setEmail}
          value={email}
        />

        <TextInput 
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
        />

        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>Role:</Text>
          <View style={styles.roleButtonsContainer}>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'student' && styles.selectedRole]}
              onPress={() => setRole('student')}
            >
              <Text style={[styles.roleText, role === 'student' && styles.selectedRoleText]}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'teacher' && styles.selectedRole]}
              onPress={() => setRole('teacher')}
            >
              <Text style={[styles.roleText, role === 'teacher' && styles.selectedRoleText]}>Teacher</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'admin' && styles.selectedRole]}
              onPress={() => setRole('admin')}
            >
              <Text style={[styles.roleText, role === 'admin' && styles.selectedRoleText]}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Log In"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: getResponsiveWidth(6),
        paddingVertical: getResponsiveHeight(5),
        minHeight: getResponsiveHeight(100)
    },
    title: {
        fontSize: 32,
        marginBottom: getResponsiveHeight(4),
        fontWeight: '600',
        textAlign: 'center',
        color: '#333'
    },
    input: {
        width: getResponsiveWidth(85),
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 16,
        fontSize: 16,
        minHeight: 56
    },
    button: {
        width: getResponsiveWidth(70),
        maxWidth: 300,
        backgroundColor: '#4a90e2',
        paddingVertical: normalize(16),
        borderRadius: normalize(12),
        alignItems: 'center',
        marginTop: getResponsiveHeight(4)
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 18
    },
    buttonDisabled: {
        backgroundColor: '#ccc'
    },
    roleContainer: {
        alignItems: 'center',
        marginBottom: getResponsiveHeight(3),
        width: '100%'
    },
    roleLabel: {
        fontSize: 18,
        color: '#333',
        marginBottom: 12
    },
    roleButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: normalize(8)
    },
    roleButton: {
        paddingVertical: normalize(10),
        paddingHorizontal: normalize(16),
        borderRadius: normalize(20),
        borderWidth: 1,
        borderColor: '#ccc',
        minWidth: normalize(80),
        alignItems: 'center',
        marginHorizontal: normalize(4),
        marginVertical: normalize(4)
    },
    selectedRole: {
        backgroundColor: '#4a90e2',
        borderColor: '#4a90e2'
    },
    roleText: {
        fontSize: 16,
        color: '#666'
    },
    selectedRoleText: {
        color: '#fff'
    }
});