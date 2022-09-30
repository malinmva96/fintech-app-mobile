import { StatusBar } from "expo-status-bar";
import { createContext, useContext, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";

const ModalContext = createContext();

export function ModalContainer({ children }) {
  const [modal, setModal] = useState(null);

  const show = (modal) => {
    setModal(modal);
  };

  const hide = () => {
    setModal(null);
  };

  return (
    <ModalContext.Provider value={{ show, hide }}>
      {children}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modal !== null}
        onRequestClose={hide}
      >
        <Pressable style={styles.backdrop} onPress={hide}>
          <Pressable style={styles.modal}>
            <View style={[styles.header, modal?.actions && styles.seperator]}>
              <Text style={styles.title}>{modal?.title}</Text>
              {modal?.subtitle && (
                <Text style={styles.subtitle}>{modal?.subtitle}</Text>
              )}
            </View>
            <FlatList
              data={modal?.actions}
              renderItem={({ item }) => (
                <TouchableHighlight underlayColor="#ddd" onPress={item.onPress}>
                  <View style={styles.itemContainer}>
                    {item.icon}
                    <Text style={styles.item}>{item.label}</Text>
                  </View>
                </TouchableHighlight>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
      <StatusBar />
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    padding: 64,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modal: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  seperator: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
  },
  itemContainer: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    marginStart: 16,
    fontSize: 16,
  },
});
