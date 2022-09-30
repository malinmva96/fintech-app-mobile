import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useClientContext } from "../lib/ClientContext";

export default function ItemPortfolio({ navigation, route }) {
  const { client, session } = useClientContext();
  const [amount, setAmount] = useState(route.params.amount?.toString() || "");
  const [error, setError] = useState(null);

  return (
    <View style={styles.itemContainer}>
      <Text style={styles.itemKey}>Symbol</Text>
      <Text style={styles.itemValue}>{route.params.symbol}</Text>
      <Text style={styles.itemKey}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        keyboardType="numeric"
        onChangeText={(text) => {
          setError(null);
          setAmount(text);
        }}
      />
      <View style={styles.button}>
        <Button
          title={route.params.amount ? "Update Portfolio" : "Add to Portfolio"}
          onPress={async () => {
            const parsedAmount = Number.parseFloat(amount);
            if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
              return setError("Invalid Amount.");
            }
            await client.from("Portfolio").upsert({
              user_id: session.user.id,
              symbol: route.params.symbol,
              amount: parsedAmount,
            });
            session.invalidate();
            navigation.pop();
          }}
        />
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
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    padding: 8,
  },
  itemKey: {
    fontSize: 16,
  },
  itemValue: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: "bold",
  },
  input: {
    borderRadius: 4,
    height: 40,
    marginVertical: 8,
    borderWidth: 1,
    padding: 10,
  },
  button: {
    marginTop: 8,
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
