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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Logged in successfully!");
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
        padding:24,
        justifyContent:'center',
        backgroundColor:'#fff'
    },

    title:{
        fontSize:20,
        marginBottom:30,
        fontWeight:600,
        textAlign:'center',
        marginTop:200
    },

    input:{
        borderWidth:1,
        borderColor: '#ccc',
        padding:14,
        borderRadius:8,
        marginBottom:16
    },
    button:{
        backgroundColor:'#4a90e2',
        padding:15,
        borderRadius:8,
        alignItems:'center',
        marginTop:10
    }, 
    
    buttonText:{
        color:'#fff',
        fontWeight:900
    },
    
    buttonDisabled:{
        backgroundColor:'#ccc'
    }
});