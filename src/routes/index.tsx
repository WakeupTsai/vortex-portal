import * as React from 'react';
import { Switch, Redirect, Route, RouteProps } from 'react-router-dom';
import { connectedRouterRedirect } from 'redux-auth-wrapper/history4/redirect';
import locationHelperBuilder from 'redux-auth-wrapper/history4/locationHelper';

import { RootState } from '@/store/ducks';
import MainLayout from '@/layouts/MainLayout';
import UserLayout from '@/layouts/UserLayout';
import UserProfile from '@/routes/Profile';
import ClusterOverview from '@/routes/Cluster/Overview';
import Node from '@/routes/Cluster/Node';
import Network from '@/routes/Cluster/Network';

import ApplicationOverview from '@/routes/Application/Overview';
import Deployment from '@/routes/Application/Deployment';
import CreateDeployment from '@/routes/Application/Deployment/Create';
import Namespace from '@/routes/Application/Namespace';
import Configmap from '@/routes/Application/Configmap';
import CreateConfigmap from '@/routes/Application/Configmap/Create';
import Pod from '@/routes/Application/Pod';
import PodDetail from '@/routes/Application/Pod/Detail';
import Service from '@/routes//Application/Service';
import Storage from '@/routes/Storage';
import Auth from '@/routes/Auth';
import ImageHub from '@/routes/ImageHub';
import Users from '@/routes/Users';
import NotFound from '@/routes/Exception/404';

interface RouteWithLayoutProps extends RouteProps {
  layout: React.ComponentClass;
  component: React.ComponentClass;
}

export function RouteWithLayout({
  layout: Layout,
  component: Component,
  ...rest
}: RouteWithLayoutProps) {
  const childComponent = (props: object) => (
    <Layout>
      <Component {...props} />
    </Layout>
  );
  return <Route {...rest} render={matchProps => childComponent(matchProps)} />;
}

const locationHelper = locationHelperBuilder({});
const userIsAuthenticated = connectedRouterRedirect({
  redirectPath: '/signin',
  authenticatedSelector: (state: RootState) => state.user.auth.isAuthenticated,
  wrapperDisplayName: 'UserIsAuthenticated'
});

const userIsNotAuthenticated = connectedRouterRedirect({
  redirectPath: (_, ownProps) =>
    locationHelper.getRedirectQueryParam(ownProps) || '/',
  allowRedirectBack: false,
  authenticatedSelector: (state: RootState) => !state.user.auth.isAuthenticated,
  wrapperDisplayName: 'UserIsNotAuthenticated'
});

const withAuthed = userIsNotAuthenticated(Auth);

const appRoutes = (
  <Switch>
    <RouteWithLayout
      layout={UserLayout}
      component={withAuthed}
      path="/signin"
    />
    <RouteWithLayout
      layout={UserLayout}
      component={withAuthed}
      path="/signup"
    />
    <Redirect exact={true} from="/" to="/cluster/node" />
    <Redirect exact={true} from="/cluster" to="/cluster/node" />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(UserProfile)}
      path="/profile"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(ClusterOverview)}
      path="/cluster/overview"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(Node)}
      path="/cluster/node"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(Network)}
      path="/cluster/network"
    />
    <Redirect exact={true} from="/application" to="/application/deployment" />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(ApplicationOverview)}
      path="/application/overview"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(Namespace)}
      path="/application/namespace"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(CreateConfigmap)}
      path="/application/configmap/create"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(Configmap)}
      path="/application/configmap/:name?"
    />
    <RouteWithLayout
      layout={MainLayout}
      exact={true}
      component={userIsAuthenticated(CreateDeployment)}
      path="/application/deployment/create"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(Deployment)}
      path="/application/deployment/:name?"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(Service)}
      path="/application/service"
    />
    <RouteWithLayout
      layout={MainLayout}
      exact={true}
      component={userIsAuthenticated(Pod)}
      path="/application/pod"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(PodDetail)}
      path="/application/pod/:name"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(Storage)}
      path="/storage"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={userIsAuthenticated(Users)}
      path="/users"
    />
    <RouteWithLayout
      layout={MainLayout}
      component={ImageHub}
      path="/imagehub"
    />
    <Route component={NotFound} />
  </Switch>
);

export default appRoutes;
