import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Fragment, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useClientContext } from "../lib/ClientContext";

export default function Login({ navigation }) {
  const { client, session } = useClientContext();
  const [register, setRegister] = useState(false);
  const [inputValues, setInputValues] = useState({
    email: "",
    name: "",
    password: "",
  });
  const [error, setError] = useState(null);

  const signIn = async () => {
    const { error } = await client.auth.signInWithPassword({
      email: inputValues.email,
      password: inputValues.password,
    });

    if (error) return setError(error.message);
    session.invalidate();
    navigation.pop();
  };

  const signUp = async () => {
    let {
      data: { session: sessionData },
      error: authError,
    } = await client.auth.signUp({
      email: inputValues.email,
      password: inputValues.password,
    });

    if (authError) return setError(authError.message);
    let { error: dbError } = await client.from("Profile").insert({
      id: sessionData.user.id,
      name: inputValues.name,
    });

    if (dbError) return setError(dbError.message);
    session.invalidate();
    navigation.pop();
  };

  return (
    <View style={styles.container}>
      {register ? (
        <Fragment>
          <Text style={styles.title}>Register</Text>
          <TextInput
            style={styles.input}
            value={inputValues.email}
            onChangeText={(text) => {
              setError(null);
              setInputValues({ ...inputValues, email: text });
            }}
            placeholder="Email"
          />
          <TextInput
            style={styles.input}
            value={inputValues.name}
            onChangeText={(text) => {
              setError(null);
              setInputValues({ ...inputValues, name: text });
            }}
            placeholder="Name"
          />
          <TextInput
            style={styles.input}
            value={inputValues.password}
            onChangeText={(text) => {
              setError(null);
              setInputValues({ ...inputValues, password: text });
            }}
            placeholder="Password"
            secureTextEntry={true}
          />
          <View style={styles.button}>
            <Button title="Register" onPress={signUp} />
          </View>
          {error && (
            <View style={styles.error}>
              <FontAwesomeIcon
                icon={faCircleExclamation}
                style={styles.errorIcon}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <Text
            style={styles.link}
            onPress={() => {
              setError(null);
              setInputValues({
                email: "",
                name: "",
                password: "",
              });
              setRegister(false);
            }}
          >
            Already have an account?
          </Text>
        </Fragment>
      ) : (
        <Fragment>
          <Text style={styles.title}>Login</Text>
          <TextInput
            style={styles.input}
            value={inputValues.email}
            onChangeText={(text) => {
              setError(null);
              setInputValues({ ...inputValues, email: text });
            }}
            placeholder="Email"
          />
          <TextInput
            style={styles.input}
            value={inputValues.password}
            onChangeText={(text) => {
              setError(null);
              setInputValues({ ...inputValues, password: text });
            }}
            placeholder="Password"
            secureTextEntry={true}
          />
          <View style={styles.button}>
            <Button title="Login" onPress={signIn} />
          </View>
          {error && (
            <View style={styles.error}>
              <FontAwesomeIcon
                icon={faCircleExclamation}
                style={styles.errorIcon}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <Text
            style={styles.link}
            onPress={() => {
              setError(null);
              setInputValues({
                email: "",
                name: "",
                password: "",
              });
              setRegister(true);
            }}
          >
            New User?
          </Text>
        </Fragment>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginVertical: 8,
    fontSize: 32,
    fontWeight: "bold",
  },
  container: {
    padding: 32,
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
  },
  input: {
    borderRadius: 4,
    height: 40,
    marginVertical: 8,
    borderWidth: 1,
    padding: 10,
  },
  button: {
    marginVertical: 8,
  },
  link: {
    marginVertical: 8,
    padding: 12,
    alignSelf: "center",
    color: "#2196F3",
    fontSize: 16,
  },
  error: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  errorIcon: {
    color: "darkred",
  },
  errorText: {
    marginStart: 4,
    color: "darkred",
    fontSize: 16,
  },
});
