import { split } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { ApolloClient } from "apollo-client";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import { InMemoryCache } from "apollo-boost";

const ConnectionStatuses = {
  CONNECTED: 1,
  DISCONNECTED: 3,
};

const client = new SubscriptionClient(globalConfig.ws_URL, {
  reconnect: true,
  minTimeout: 6000,
  name: "notification-subscribe",
  version: "1.3",
  //queryDeduplication: false,
});

client.onConnected(() => {
  //console.log("Connected");
});

client.onConnecting(() => {
  //console.log("Connecting");
});

client.onReconnecting(() => {
  //console.log("Reconnecting");
});

client.onDisconnected(() => {
  //console.log("Disconnected");
});

const httpLink = new HttpLink({
  uri: globalConfig.gql_URL,
});

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  client,
  httpLink
);

function CloseConnection() {
  if (Number(client.status) != ConnectionStatuses.DISCONNECTED) {
    client.close();
  }
}

function Connect() {
  if (Number(client.status) === ConnectionStatuses.DISCONNECTED) {
    client.connect();
  }
}

function GetStatus() {
  return client.status;
}

function ConnectClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link,
  });
}

export default {
  CloseConnection,
  ConnectClient,
  Connect,
  GetStatus,
};
