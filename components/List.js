import {
  faEye,
  faEyeSlash,
  faFileCirclePlus,
  faFilePen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useFocusEffect } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  Touchable,
  TouchableHighlight,
  View,
} from "react-native";
import { useCallback } from "react/cjs/react.development";
import { Fragment } from "react/cjs/react.production.min";
import { useClientContext } from "../lib/ClientContext";
import { useModal } from "../lib/Modal";
import Loading from "./Loading";

function Empty({ mode }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {mode && mode.replace(/^(\w)(\w+)/, (_, i, r) => i.toUpperCase() + r)}{" "}
        is empty.
      </Text>
      <Text style={styles.emptySummary}>
        Add coins to the {mode} by long pressing, or from the coin detail
        screen.
      </Text>
    </View>
  );
}

function Item({ item, onPress, onLongPress }) {
  return (
    <TouchableHighlight
      onPress={onPress}
      onLongPress={onLongPress}
      underlayColor="#ddd"
    >
      <View style={styles.itemContainer}>
        <Image style={styles.itemImage} source={{ uri: item.image }} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text>{item.subtitle}</Text>
        </View>
        {item.side && <Text style={styles.itemSide}>{item.side}</Text>}
      </View>
    </TouchableHighlight>
  );
}

export default function List({ navigation, watchlist, portfolio }) {
  const { client, session } = useClientContext();
  const modal = useModal();
  const [list, setList] = useState(null);
  const watchlistRef = useRef();
  const portfolioRef = useRef();

  useFocusEffect(
    useCallback(() => {
      const update = async () => {
        let params = {};

        if (watchlistRef.current !== watchlist)
          watchlistRef.current = watchlist;
        if (portfolioRef.current !== portfolio)
          portfolioRef.current = portfolio;

        if (watchlistRef.current !== undefined)
          params.symbols = watchlistRef.current;
        if (portfolioRef.current !== undefined)
          params.symbols = portfolioRef.current.reduce(
            (arr, item) => arr.concat(Object.keys(item)),
            []
          );

        const { data: list } = await client.functions.invoke("latest", {
          body: JSON.stringify(params),
        });
        setList(list);
      };

      if (
        list === null ||
        watchlistRef.current !== watchlist ||
        portfolioRef.current !== portfolio
      ) {
        update();
        return;
      }

      const timeout = setTimeout(update, 60000);
      return () => {
        clearTimeout(timeout);
      };
    })
  );

  const renderItem = ({ item }) => {
    return (
      <Item
        item={item}
        onPress={() => {
          navigation.navigate("Item", { symbol: item.id });
        }}
        onLongPress={() => {
          modal.show({
            title: item.id,
            actions: session.user && [
              session.user.watchlist.includes(item.id)
                ? {
                    label: "Remove from Watchlist",
                    icon: <FontAwesomeIcon icon={faEyeSlash} />,
                    onPress: async () => {
                      await client
                        .from("Watchlist")
                        .delete()
                        .match({ user_id: session.user.id, symbol: item.id });
                      session.invalidate();
                      modal.hide();
                    },
                  }
                : {
                    label: "Add to Watchlist",
                    icon: <FontAwesomeIcon icon={faEye} />,
                    onPress: async () => {
                      await client
                        .from("Watchlist")
                        .insert({ user_id: session.user.id, symbol: item.id });
                      session.invalidate();
                      modal.hide();
                    },
                  },
              session.user.portfolio
                ?.reduce((arr, item) => arr.concat(Object.keys(item)), [])
                .includes(item.id)
                ? {
                    label: "Update Portfolio",
                    icon: <FontAwesomeIcon icon={faFilePen} />,
                    onPress: () => {
                      const itemAmount = session.user.portfolio.find(
                        (i) => Object.keys(i)[0] === item.id
                      )[item.id];
                      navigation.navigate("ItemPortfolio", {
                        symbol: item.id,
                        amount: itemAmount,
                      });
                      modal.hide();
                    },
                  }
                : {
                    label: "Add to Portfolio",
                    icon: <FontAwesomeIcon icon={faFileCirclePlus} />,
                    onPress: () => {
                      navigation.navigate("ItemPortfolio", {
                        symbol: item.id,
                      });
                      modal.hide();
                    },
                  },
            ],
          });
        }}
      />
    );
  };

  return list !== null ? (
    list.length ? (
      <Fragment>
        <FlatList
          data={
            portfolioRef.current
              ? list.map((item) => {
                  const itemAmount = portfolioRef.current.find(
                    (i) => Object.keys(i)[0] === item.id
                  )[item.id];
                  return {
                    ...item,
                    title: item.id,
                    subtitle: itemAmount,
                    side: `$${Math.round(itemAmount * item.price * 100) / 100}`,
                  };
                })
              : list.map((item) => ({
                  ...item,
                  title: item.id,
                  subtitle: `$${item.price}`,
                }))
          }
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
        {portfolioRef.current && (
          <View style={styles.portfolioContainer}>
            <Text style={styles.portfolioTitle}>Total</Text>
            <Text style={styles.portfolioSide}>
              $
              {Math.round(
                list
                  .map((item) => {
                    const itemAmount = portfolioRef.current.find(
                      (i) => Object.keys(i)[0] === item.id
                    )[item.id];
                    return itemAmount * item.price;
                  })
                  .reduce((total, amount) => total + amount) * 100
              ) / 100}
            </Text>
          </View>
        )}
      </Fragment>
    ) : (
      <Empty
        mode={
          portfolioRef.current
            ? "portfolio"
            : watchlistRef.current
            ? "watchlist"
            : "list"
        }
      />
    )
  ) : (
    <Loading />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 56,
  },
  itemTextContainer: {
    flex: 1,
    paddingStart: 8,
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemSide: {
    fontSize: 20,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    paddingBottom: 12,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptySummary: {
    textAlign: "center",
  },
  portfolioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  portfolioTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  portfolioSide: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
