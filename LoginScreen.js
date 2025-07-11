import { Alert, Platform, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'

export default function LoginScreen() {

const handleLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (email === "sduisaac@gmail.com" && password === '1234') {
            Alert.alert("Success", "Logged In");

        } else {
            Alert.alert('Error', 'Invalid Credentials');
        }
    }
};

const handleSocialLogin = (platform) => {
    Alert.alert('Social Login', `Logging in with ${platform}`);
}

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Welcome Back</Text>
    </View>
  )
}

const styles = StyleSheet.create({})