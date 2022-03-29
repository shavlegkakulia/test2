import React from "react";
import DashboardPage from './dashboard/dashboard';
import {
  stateService
} from "./../services/imports";
import { states } from "./../models/states";
import gql from "graphql-tag";
import { useSubscription } from "@apollo/react-hooks";

const DashboardContainer = (props) => {
  const SUBSCRIBE_NOTIFICATIONS = gql`
    subscription {
      takeNotification(userid: ${stateService.getState(states.userInfo).value.id}) {
        id
        type
        userid
        objectid
      }
    }
  `;

  const { data, error, loading } = useSubscription(SUBSCRIBE_NOTIFICATIONS, {
    variables: {
      userid: stateService.getState(states.userInfo).value.id,
    },
  });

  return <DashboardPage socketResponse={data?.takeNotification} {...props} />
 
};

export default DashboardContainer;
