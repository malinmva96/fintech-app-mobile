import {
  faCircleUser,
  faCoins,
  faEye,
  faFileLines,
  faFilePen,
  faRightFromBracket,
  faRightToBracket,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Fragment } from "react";
import { StatusBar, StyleSheet, TouchableHighlight } from "react-native";
import "react-native-url-polyfill/auto";
import Item from "./components/Item";
import ItemPortfolio from "./components/ItemPortfolio";
import List from "./components/List";
import Login from "./components/Login";
import LoginPrompt from "./components/LoginPrompt";
import { ClientProvider, useClientContext } from "./lib/ClientContext";
import { ModalContainer, useModal } from "./lib/Modal";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Watchlist({ navigation }) {
  const { session } = useClientContext();

  return session.user ? (
    <List watchlist={session.user.watchlist} navigation={navigation} />
  ) : (
    <LoginPrompt
      large
      onPress={() => {
        navigation.navigate("Login");
      }}
    />
  );
}

function Portfolio({ navigation }) {
  const { session } = useClientContext();

  return session.user ? (
    <List portfolio={session.user.portfolio} navigation={navigation} />
  ) : (
    <LoginPrompt
      large
      onPress={() => {
        navigation.navigate("Login");
      }}
    />
  );
}

function Home() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Coins"
        component={List}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faCoins} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Watchlist"
        component={Watchlist}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faEye} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={Portfolio}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faFileLines} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function Window() {
  const { client, session } = useClientContext();
  const modal = useModal();

  return (
    session.user !== undefined && (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={({ navigation }) => ({
            headerRight: () =>
              session.user ? (
                <TouchableHighlight
                  style={styles.actionButton}
                  onPress={() => {
                    modal.show({
                      title: session.user.name,
                      subtitle: session.user.email,
                      actions: [
                        {
                          label: "Logout",
                          icon: <FontAwesomeIcon icon={faRightFromBracket} />,
                          onPress: async () => {
                            await client.auth.signOut();
                            session.invalidate();
                            modal.hide();
                          },
                        },
                      ],
                    });
                  }}
                  underlayColor="#ddd"
                >
                  <FontAwesomeIcon icon={faCircleUser} />
                </TouchableHighlight>
              ) : (
                <TouchableHighlight
                  style={styles.actionButton}
                  onPress={() => {
                    navigation.navigate("Login");
                  }}
                  underlayColor="#ddd"
                >
                  <FontAwesomeIcon icon={faRightToBracket} />
                </TouchableHighlight>
              ),
          })}
        >
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen
            name="Item"
            component={Item}
            options={({ route }) => ({ title: route.params.symbol })}
          />
          <Stack.Screen
            name="ItemPortfolio"
            component={ItemPortfolio}
            options={({ navigation, route }) => ({
              title: route.params?.amount
                ? "Update Portfolio"
                : "Add to Portfolio",
              headerRight: () =>
                route.params?.amount ? (
                  <TouchableHighlight
                    style={styles.actionButton}
                    onPress={async () => {
                      await client.from("Portfolio").delete().match({
                        user_id: session.user.id,
                        symbol: route.params.symbol,
                      });
                      session.invalidate();
                      navigation.pop();
                    }}
                    underlayColor="#ddd"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </TouchableHighlight>
                ) : (
                  <Fragment></Fragment>
                ),
            })}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    )
  );
}

export default function App() {
  return (
    <ClientProvider>
      <ModalContainer>
        <Window />
      </ModalContainer>
    </ClientProvider>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    padding: 8,
    borderRadius: 24,
  },
});
