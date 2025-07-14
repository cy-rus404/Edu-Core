import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { Picker } from '@react-native-picker/picker';
import { supabase } from './supabase';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    
    // Check for admin credentials
    if (email === "admin@educore.com" && password === "admin123" && role === "admin") {
      onLogin("admin", "admin");
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

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={role}
          style={styles.picker}
          onValueChange={setRole}
        >
          <Picker.Item label="Student" value="student" />
          <Picker.Item label="Teacher" value="teacher" />
          <Picker.Item label="Admin" value="admin" />
        </Picker>
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
    
    pickerContainer:{
        width: 300,
        borderWidth:1,
        borderColor: '#ccc',
        borderRadius:12,
        marginBottom:20,
        backgroundColor:'#fff'
    },
    
    picker:{
        height:56,
        width:'100%'
    }
});