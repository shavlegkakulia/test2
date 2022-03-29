import "./lib";

import React from "react";
import ReactDom from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Route } from "./components/routing/imports";
import { ApolloProvider } from "@apollo/react-hooks";
import GraphqlClientService from './services/GraphqlClientService';

import MainComponent from "./main";

ReactDom.render(
  <ApolloProvider client={GraphqlClientService.ConnectClient()}>
    <BrowserRouter>
      <Route path="/" component={MainComponent} skipReload />
    </BrowserRouter>
  </ApolloProvider>,
  document.getElementById("react-app")
);
