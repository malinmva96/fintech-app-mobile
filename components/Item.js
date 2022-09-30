import {
  faCaretDown,
  faCaretUp,
  faEye,
  faEyeSlash,
  faFileCirclePlus,
  faFilePen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import Svg, { Line, Text as SvgText } from "react-native-svg";
import { useClientContext } from "../lib/ClientContext";
import Loading from "./Loading";
import LoginPrompt from "./LoginPrompt";

export default function Item({ route, navigation }) {
  const { client, session } = useClientContext();
  const [item, setItem] = useState(null);
  const [graph, setGraph] = useState(null);
  const [message, setMessage] = useState("");
  const [isPosting, setPosting] = useState(false);
  const [posts, setPosts] = useState(null);
  const [maxX, setMaxX] = useState(0);
  const [minX, setMinX] = useState(0);

  const updatePosts = async () => {
    const { data: posts } = await client
      .from("Post")
      .select(
        `trend,
        message,
        created_at, 
        Profile(
          name
        )`
      )
      .eq("symbol", route.params.symbol)
      .order("created_at", { ascending: false });
    setPosts(
      posts.map((post) => {
        const created_at = new Date(post.created_at);
        return {
          ...post,
          created_at: `${created_at.toLocaleDateString(
            "en-UK"
          )} ${created_at.toLocaleTimeString("en-UK")}`,
        };
      })
    );
  };

  useEffect(() => {
    const update = async () => {
      const { data: item } = await client.functions.invoke("latest", {
        body: JSON.stringify({ symbol: route.params.symbol }),
      });
      setItem(item);
    };
    if (item === null) {
      update();
      return;
    }
    const timeout = setTimeout(update, 60000);
    return () => {
      clearTimeout(timeout);
    };
  }, [item]);

  useEffect(() => {
    if (item !== null) updatePosts();
  }, [item, posts]);

  return item ? (
    <ScrollView>
      <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <View>
            <Text style={styles.itemTitle}>
              {item.name} ({item.id})
            </Text>
            <Text style={styles.itemHeadline}>${item.price}</Text>
          </View>
          {session.user && (
            <View style={styles.itemActions}>
              {session.user?.watchlist.includes(item.id) ? (
                <TouchableHighlight
                  style={styles.itemAction}
                  onPress={async () => {
                    await client
                      .from("Watchlist")
                      .delete()
                      .match({ user_id: session.user.id, symbol: item.id });
                    session.invalidate();
                  }}
                  underlayColor="#ddd"
                >
                  <FontAwesomeIcon icon={faEyeSlash} size={24} />
                </TouchableHighlight>
              ) : (
                <TouchableHighlight
                  style={styles.itemAction}
                  onPress={async () => {
                    await client
                      .from("Watchlist")
                      .insert({ user_id: session.user.id, symbol: item.id });
                    session.invalidate();
                  }}
                  underlayColor="#ddd"
                >
                  <FontAwesomeIcon icon={faEye} size={24} />
                </TouchableHighlight>
              )}
              {session.user.portfolio
                ?.reduce((arr, item) => arr.concat(Object.keys(item)), [])
                .includes(item.id) ? (
                <TouchableHighlight
                  style={styles.itemAction}
                  onPress={() => {
                    const itemAmount = session.user.portfolio.find(
                      (i) => Object.keys(i)[0] === item.id
                    )[item.id];
                    navigation.navigate("ItemPortfolio", {
                      symbol: item.id,
                      amount: itemAmount,
                    });
                  }}
                  underlayColor="#ddd"
                >
                  <FontAwesomeIcon icon={faFilePen} size={24} />
                </TouchableHighlight>
              ) : (
                <TouchableHighlight
                  style={styles.itemAction}
                  onPress={() => {
                    navigation.navigate("ItemPortfolio", {
                      symbol: item.id,
                    });
                  }}
                  underlayColor="#ddd"
                >
                  <FontAwesomeIcon icon={faFileCirclePlus} size={24} />
                </TouchableHighlight>
              )}
            </View>
          )}
        </View>
        <Svg
          width="100%"
          height="300px"
          onLayout={(ev) => {
            const { width, height } = ev.nativeEvent.layout;

            const maxPoint = Math.max(...item.history);
            const minPoint = Math.min(...item.history);

            let points = [];
            for (let i = 0; i < item.history.length; i++) {
              if (i + 1 < item.history.length) {
                if (item.history[i] === maxPoint)
                  setMaxX((width / (item.history.length - 1)) * i);
                if (item.history[i] === minPoint)
                  setMinX((width / (item.history.length - 1)) * i);

                points.push({
                  x1: (width / (item.history.length - 1)) * i,
                  y1:
                    (height - 54) *
                      (1 -
                        (item.history[i] - minPoint) / (maxPoint - minPoint)) +
                    27,
                  x2: (width / (item.history.length - 1)) * (i + 1),
                  y2:
                    (height - 54) *
                      (1 -
                        (item.history[i + 1] - minPoint) /
                          (maxPoint - minPoint)) +
                    27,
                });
              }
            }

            setGraph({
              maxPoint,
              minPoint,
              start: 0,
              end: width,
              points,
            });
          }}
        >
          {graph !== null && (
            <Fragment>
              {graph.points.map((point, index) => (
                <Line
                  key={index}
                  x1={point.x1}
                  y1={point.y1}
                  x2={point.x2}
                  y2={point.y2}
                  stroke="black"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              ))}
              <SvgText
                fill="#186a26"
                fontSize={18}
                x={maxX}
                y={17}
                textAnchor="middle"
                onLayout={(ev) => {
                  const { width } = ev.nativeEvent.layout;

                  if (width !== graph.end - graph.start)
                    setMaxX(
                      Math.min(
                        Math.max(maxX, graph.start + width / 2),
                        graph.end - width / 2
                      )
                    );
                }}
              >
                {`$${graph.maxPoint}`}
              </SvgText>
              <SvgText
                fill="#7c0d09"
                fontSize={18}
                x={minX}
                y={299}
                textAnchor="middle"
                onLayout={(ev) => {
                  const { width } = ev.nativeEvent.layout;

                  if (width !== graph.end - graph.start)
                    setMinX(
                      Math.min(
                        Math.max(minX, graph.start + width / 2),
                        graph.end - width / 2
                      )
                    );
                }}
              >
                {`$${graph.minPoint}`}
              </SvgText>
            </Fragment>
          )}
        </Svg>
        <Text style={styles.itemDescriptionTitle}>Description</Text>
        <Text numberOfLines={5}>{item.description}</Text>
        <Text style={styles.itemDescriptionTitle}>Live Chat</Text>
        {session.user ? (
          <Fragment>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="What do you think?"
            />
            <View style={styles.buttonBar}>
              {isPosting ? (
                <Text>Please wait...</Text>
              ) : (
                <Fragment>
                  <TouchableHighlight
                    style={styles.buttonRed}
                    underlayColor="rgba(255, 58, 49, 0.7)"
                    onPress={async () => {
                      setPosting(true);
                      await client.from("Post").insert({
                        user_id: session.user.id,
                        symbol: route.params.symbol,
                        message,
                        trend: "bearish",
                      });
                      await updatePosts();
                      setPosting(false);
                      setMessage("");
                    }}
                  >
                    <View style={styles.buttonContainer}>
                      <FontAwesomeIcon icon={faCaretDown} color="#3f0705" />
                      <Text
                        style={[
                          styles.buttonText,
                          {
                            color: "#3f0705",
                          },
                        ]}
                      >
                        Bearish
                      </Text>
                    </View>
                  </TouchableHighlight>
                  <TouchableHighlight
                    style={styles.buttonGreen}
                    underlayColor="rgba(78, 217, 100, 0.7)"
                    onPress={async () => {
                      setPosting(true);
                      await client.from("Post").insert({
                        user_id: session.user.id,
                        symbol: route.params.symbol,
                        message,
                        trend: "bullish",
                      });
                      await updatePosts();
                      setPosting(false);
                      setMessage("");
                    }}
                  >
                    <View style={styles.buttonContainer}>
                      <FontAwesomeIcon icon={faCaretUp} color="#0c3413" />
                      <Text
                        style={[
                          styles.buttonText,
                          {
                            color: "#0c3413",
                          },
                        ]}
                      >
                        Bullish
                      </Text>
                    </View>
                  </TouchableHighlight>
                </Fragment>
              )}
            </View>
          </Fragment>
        ) : (
          <LoginPrompt
            onPress={() => {
              navigation.navigate("Login");
            }}
          />
        )}
        <View style={styles.topBorder}>
          {posts !== null ? (
            posts.length ? (
              posts.map((item) => (
                <View key={item.created_at} style={styles.postContainer}>
                  <View style={styles.postHeader}>
                    <View>
                      <Text style={styles.postTitle}>{item.Profile.name}</Text>
                      <Text style={styles.postSubtitle}>{item.created_at}</Text>
                    </View>
                    <View
                      style={[
                        styles.postStatus,
                        item.trend === "bearish"
                          ? {
                              backgroundColor: "rgba(255, 58, 49, 0.4)",
                            }
                          : {
                              backgroundColor: "rgba(78, 217, 100, 0.4)",
                            },
                      ]}
                    >
                      {item.trend === "bearish" ? (
                        <FontAwesomeIcon
                          icon={faCaretDown}
                          color="#3f0705"
                          size={12}
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faCaretUp}
                          color="#0c3413"
                          size={12}
                        />
                      )}
                      <Text
                        style={[
                          styles.postStatusText,
                          item.trend === "bearish"
                            ? {
                                color: "#3f0705",
                              }
                            : {
                                color: "#0c3413",
                              },
                        ]}
                      >
                        {item.trend === "bearish" ? "Bearish" : "Bullish"}
                      </Text>
                    </View>
                  </View>
                  <Text>{item.message}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text>No posts.</Text>
              </View>
            )
          ) : (
            <View style={styles.emptyContainer}>
              <Text>Loading...</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  ) : (
    <Loading />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    padding: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  itemHeadline: {
    fontSize: 32,
  },
  itemActions: {
    flexDirection: "row",
  },
  itemAction: {
    padding: 8,
    borderRadius: 24,
    overflow: "hidden",
  },
  itemDescriptionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  input: {
    borderRadius: 4,
    height: 40,
    marginVertical: 8,
    borderWidth: 1,
    padding: 10,
  },
  buttonBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  buttonRed: {
    marginEnd: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 58, 49, 0.4)",
  },
  buttonGreen: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(78, 217, 100, 0.4)",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    marginStart: 8,
    fontSize: 16,
  },
  topBorder: {
    marginTop: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  emptyContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  postContainer: {
    paddingVertical: 16,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  postSubtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  postStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  postStatusText: {
    fontSize: 14,
    marginStart: 8,
  },
});

function getDimensions(element) {
  const containerRef = useRef();
}
