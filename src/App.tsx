import React, { useState } from "react";
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route } from "react-router-dom";

import "./theme/variables.css";
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/palettes/dark.system.css";

import LoginForm from "./components/login_form/LoginForm";
import RegisterForm from "./components/register/RegisterForm";
import MapComponent from "./components/map/map";
import Payments from "./components/payments/Payments";

setupIonicReact();

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const SERVER = "http://localhost:8080";

  const handleLoginStateChange = (loggedIn: boolean) => {
    setIsLoggedIn(loggedIn);
  };

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/login" exact>
            <LoginForm
              SERVER={SERVER}
              onLoginStateChange={handleLoginStateChange}
            />
          </Route>

          <Route path="/register" exact>
            <RegisterForm />
          </Route>

          <Route path="/map" exact>
            <MapComponent />
          </Route>

          <Route path="/payments" exact>
            <Payments />
          </Route>

          <Route exact path="/">
            <Redirect to={isLoggedIn ? "/map" : "/login"} />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
