import * as React from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage, InjectedIntlProps } from 'react-intl';
import { Card, Form, Input, Button, notification, Table } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { ColumnProps } from 'antd/lib/table';
import { Dispatch } from 'redux';

import { RootState, RTDispatch, RootAction } from '@/store/ducks';
import { hubOperations, hubActions } from '@/store/ducks/hub';
import { Login } from '@/models/Query';
import { basicTokenToData } from '@/utils/auth';

import * as styles from './styles.module.scss';

const FormItem = Form.Item;
const REGISTRY_TOKEN = 'REGISTRY_TOKEN';

interface Image {
  key: number;
  name: string;
  tags: Array<string>;
}
interface HubProps extends FormComponentProps, InjectedIntlProps {
  isAuth: boolean;
  isError: boolean;
  isLoading: boolean;
  token: string;
  images: Array<Image>;
  authRegistry: (data: Login) => any;
  fetchImagesData: () => any;
  resetError: () => any;
}

class ImageHub extends React.PureComponent<HubProps, object> {
  private columns: Array<ColumnProps<Image>> = [
    {
      title: this.props.intl.formatMessage({ id: 'hub.image' }),
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: this.props.intl.formatMessage({ id: 'hub.tags' }),
      dataIndex: 'tags',
      key: 'tags'
    }
  ];
  constructor(props: HubProps) {
    super(props);
    this.state = {};
  }

  public componentDidMount() {
    const token = localStorage.getItem(REGISTRY_TOKEN);
    if (token) {
      this.props.authRegistry(basicTokenToData(token));
    }
  }

  public componentDidUpdate(prevProps: HubProps) {
    const { formatMessage } = this.props.intl;
    if (!prevProps.isError && this.props.isError) {
      notification.error({
        message: formatMessage({ id: 'auth.hint.loginFailure' }),
        description: formatMessage({
          id: 'auth.hint.reason.wrongUsernameAndPassword'
        }),
        onClose: this.props.resetError()
      });
    }

    if (!prevProps.isAuth && this.props.isAuth) {
      localStorage.setItem(REGISTRY_TOKEN, this.props.token);
      this.props.fetchImagesData();
    }
  }

  protected handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
      }
      const data = this.props.form.getFieldsValue() as Login;
      this.props.authRegistry(data);
    });
  };

  public renderLoginForm = () => {
    const { getFieldDecorator } = this.props.form;
    return (
      <Card
        className={styles.form}
        title={<FormattedMessage id="hub.imageHub" />}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem label={<FormattedMessage id="auth.username" />}>
            {getFieldDecorator('username', { rules: [{ required: true }] })(
              <Input />
            )}
          </FormItem>
          <FormItem label={<FormattedMessage id="auth.password" />}>
            {getFieldDecorator('password', { rules: [{ required: true }] })(
              <Input type="password" />
            )}
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              <FormattedMessage id="hub.login" />
            </Button>
          </FormItem>
        </Form>
      </Card>
    );
  };

  public render() {
    const { isAuth, isLoading, images } = this.props;
    return (
      <React.Fragment>
        {isAuth ? (
          <Card title={<FormattedMessage id="hub.imageHub" />}>
            <Table
              dataSource={images}
              columns={this.columns}
              loading={isLoading}
            />
          </Card>
        ) : (
          this.renderLoginForm()
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: RootState) => {
  return {
    isAuth: state.hub.isAuth,
    isError: state.hub.isError,
    isLoading: state.hub.isLoading,
    token: state.hub.token,
    images: state.hub.repos.map((item, idx) => ({ ...item, key: idx }))
  };
};

const mapDispatchToProps = (dispatch: RTDispatch & Dispatch<RootAction>) => ({
  authRegistry: (data: Login) => dispatch(hubOperations.authRegistry(data)),
  fetchImagesData: () => dispatch(hubOperations.fetchImagesData()),
  resetError: () => dispatch(hubActions.resetAuthError())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Form.create()(injectIntl(ImageHub)));