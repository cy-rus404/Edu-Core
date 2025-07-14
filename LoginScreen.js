import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { supabase } from './supabase';

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
    <View style={styles.container}>
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

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Log In"}
        </Text>
      </TouchableOpacity>
   
   
    </View>
  );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        justifyContent:'center',
        alignItems:'center',
        paddingHorizontal:24,
        backgroundColor:'#fff'
    },

    title:{
        fontSize:28,
        marginBottom:40,
        fontWeight:'600',
        textAlign:'center',
        color:'#333'
    },

    input:{
        width: 300,
        // maxWidth:400,
        borderWidth:1,
        borderColor: '#ccc',
        paddingVertical:22,
        paddingHorizontal:20,
        borderRadius:12,
        marginBottom:20,
        fontSize:18,
        minHeight:56
    },
    button:{
        width: 250,
        // maxWidth:200,
        backgroundColor:'#4a90e2',
        padding:18,
        borderRadius:12,
        alignItems:'center',
        marginTop:130,
        zIndex: 1,
        elevation: 1
    }, 
    
    buttonText:{
        color:'#fff',
        fontWeight:'700',
        fontSize:18
    },
    
    buttonDisabled:{
        backgroundColor:'#ccc'
    },
    
    roleContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    roleLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
    },
    roleButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 8,
        width: 120,
        alignItems: 'center',
    },
    selectedRole: {
        backgroundColor: '#4a90e2',
        borderColor: '#4a90e2',
    },
    roleText: {
        fontSize: 14,
        color: '#666',
    },
    selectedRoleText: {
        color: '#fff',
    }
});