import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";

export default function LoginScreen() {
  const handleLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {
      if (email === "sduisaac@gmail.com" && password === "1234") {
        Alert.alert("Success", "Logged In");
      } else {
        Alert.alert("Error", "Invalid Credentials");
      }
    };
  };

  const handleSocialLogin = (platform) => {
    Alert.alert("Social Login", `Logging in with ${platform}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={"setEmail"}
        value={"email"}
      />

      <TextInput style={styles.input}
      placeholder="password"
      secureTextEntry
      onChangeText={"setPassword"}
      value={"password"}/>

    <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
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
    }
});