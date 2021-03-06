import * as React from 'react';
import { connect } from 'react-redux';
import { Card, Button, Icon, Table, notification } from 'antd';
import { injectIntl, FormattedMessage, InjectedIntlProps } from 'react-intl';
import { ColumnProps } from 'antd/lib/table';
import * as moment from 'moment';
import { mapValues } from 'lodash';
import { Dispatch } from 'redux';
import { InjectedAuthRouterProps } from 'redux-auth-wrapper/history4/redirect';

import * as styles from './styles.module.scss';
import StorageForm from '@/components/StorageForm';
import VolumeForm from '@/components/VolumeForm';
import ItemActions from '@/components/ItemActions';
import { RootState, RTDispatch, RootAction } from '@/store/ducks';
import { storageOperations, storageActions } from '@/store/ducks/storage';
import { volumeOperations, volumeActions } from '@/store/ducks/volume';
import {
  Storage as StorageModel,
  StorageFields,
  Volume as VolumeModel,
  VolumeFields,
  AccessMode
} from '@/models/Storage';
import * as NamespaceModel from '@/models/Namespace';
import * as namespaceAPI from '@/services/namespace';
import { FormField } from '@/utils/types';
import { toTitleCase } from '@/utils/string';
import withCapitalize from '@/containers/withCapitalize';

type StorageProps = OwnProps & InjectedAuthRouterProps & InjectedIntlProps;

const CapitalizedMessage = withCapitalize(FormattedMessage);

interface OwnProps {
  storages: {
    data: Array<StorageModel>;
    isLoading: boolean;
    error: Error | null;
  };
  volumes: {
    data: Array<VolumeModel>;
    isLoading: boolean;
    error: Error | null;
  };
  fetchStorages: () => any;
  fetchVolumes: () => any;
  addStorage: (data: StorageFields) => any;
  addVolume: (data: VolumeFields) => any;
  removeStorage: (id: string) => any;
  removeVolume: (id: string) => any;
  clearStorageError: () => any;
  clearVolumeError: () => any;
}

interface StorageState {
  isCreatingStorage: boolean;
  isCreatingVolume: boolean;
  tabKey: string;
  namespaces: Array<NamespaceModel.Namespace>;
  storageFields: FormField<StorageFields>;
  volumeFields: FormField<VolumeFields>;
}

const tabList = [
  {
    key: 'storage',
    tab: <CapitalizedMessage id="storage" />
  },
  {
    key: 'volume',
    tab: <CapitalizedMessage id="volume" />
  }
];

class Storage extends React.PureComponent<StorageProps, StorageState> {
  private actionColumn: ColumnProps<StorageModel | VolumeModel> = {
    title: toTitleCase(this.props.intl.formatMessage({ id: 'action' })),
    render: (_, record) => {
      return (
        <ItemActions
          items={[
            {
              type: 'delete',
              onConfirm: this.handleItemDelete.bind(this, record.id)
            }
          ]}
        />
      );
    }
  };

  private storageColumns: Array<ColumnProps<StorageModel>> = [
    {
      title: toTitleCase(this.props.intl.formatMessage({ id: 'name' })),
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: toTitleCase(this.props.intl.formatMessage({ id: 'owner' })),
      dataIndex: 'owner',
      key: 'owner'
    },
    {
      title: toTitleCase(this.props.intl.formatMessage({ id: 'storage.type' })),
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: toTitleCase(
        this.props.intl.formatMessage({ id: 'storage.storageClassName' })
      ),
      dataIndex: 'storageClassName',
      key: 'storageClassName'
    },
    {
      title: this.props.intl.formatMessage({ id: 'storage.ip' }),
      dataIndex: 'ip',
      key: 'ip'
    },
    {
      title: toTitleCase(this.props.intl.formatMessage({ id: 'storage.path' })),
      dataIndex: 'path',
      key: 'path'
    },
    {
      title: toTitleCase(this.props.intl.formatMessage({ id: 'createdAt' })),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: text => moment(text).calendar()
    },
    this.actionColumn
  ];

  private volumeColumns: Array<ColumnProps<VolumeModel>> = [
    {
      title: toTitleCase(this.props.intl.formatMessage({ id: 'name' })),
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: toTitleCase(this.props.intl.formatMessage({ id: 'owner' })),
      dataIndex: 'owner',
      key: 'owner'
    },
    {
      title: toTitleCase(this.props.intl.formatMessage({ id: 'namespace' })),
      dataIndex: 'namespace',
      key: 'namespace'
    },
    {
      title: toTitleCase(
        this.props.intl.formatMessage({ id: 'volume.storageName' })
      ),
      dataIndex: 'storageName',
      key: 'storageName'
    },
    {
      title: toTitleCase(
        this.props.intl.formatMessage({ id: 'volume.accessMode' })
      ),
      dataIndex: 'accessMode',
      key: 'accessMode'
    },
    {
      title: toTitleCase(this.props.intl.formatMessage({ id: 'createdAt' })),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: text => moment(text).calendar()
    },
    this.actionColumn
  ];

  private storageFactory = () => {
    return {
      name: {
        value: ''
      },
      type: {
        value: 'nfs'
      },
      ip: {
        value: ''
      },
      path: {
        value: ''
      }
    };
  };

  private volumeFactory = () => {
    return {
      name: {
        value: ''
      },
      namespace: {
        value: ''
      },
      storageName: {
        value: ''
      },
      accessMode: {
        value: AccessMode.ReadWriteMany
      },
      capacity: {
        value: '300Gi'
      }
    };
  };

  constructor(props: StorageProps) {
    super(props);
    this.state = {
      isCreatingStorage: false,
      isCreatingVolume: false,
      tabKey: 'storage',
      namespaces: [],
      storageFields: this.storageFactory(),
      volumeFields: this.volumeFactory()
    };
  }

  public componentWillMount() {
    this.props.fetchStorages();
    this.props.fetchVolumes();
  }

  protected getFlatFormFieldValue = (target: string) => {
    return mapValues(this.state[target], 'value');
  };

  protected handleItemDelete = (id: string) => {
    const { tabKey } = this.state;
    const { formatMessage } = this.props.intl;
    this.props.clearVolumeError();

    switch (tabKey) {
      case 'storage':
        this.props.removeStorage(id);
        if (!this.props.storages.error) {
          notification.success({
            message: formatMessage({
              id: 'action.success'
            }),
            description: formatMessage({
              id: 'storage.hint.delete.success'
            })
          });
        } else {
          notification.error({
            message: formatMessage({
              id: 'action.failure'
            }),
            description:
              formatMessage({
                id: 'storage.hint.delete.failure'
              }) +
              ' (' +
              this.props.storages.error.message +
              ')'
          });
        }
        break;
      case 'volume':
        this.props.removeVolume(id);

        if (!this.props.volumes.error) {
          notification.success({
            message: formatMessage({
              id: 'action.success'
            }),
            description: formatMessage({
              id: 'volume.hint.delete.success'
            })
          });
        } else {
          notification.error({
            message: formatMessage({
              id: 'action.failure'
            }),
            description:
              formatMessage({
                id: 'volume.hint.delete.failure'
              }) +
              ' (' +
              this.props.volumes.error.message +
              ')'
          });
        }
        break;
    }
  };

  protected handleAddItem = () => {
    this.setState(prevState => {
      switch (prevState.tabKey) {
        case 'storage':
          return {
            ...prevState,
            isCreatingStorage: true
          };
        case 'volume':
          namespaceAPI.getNamespaces().then(res => {
            this.setState({ namespaces: res.data });
          });
          return {
            ...prevState,
            isCreatingVolume: true
          };
        default:
          return prevState;
      }
    });
  };

  protected handleFormChange = (target: string) => (changedFields: any) => {
    this.setState(prevState => {
      return {
        ...prevState,
        [target]: {
          ...prevState[target],
          ...changedFields
        }
      };
    });
  };

  protected handleFormClose = () => {
    this.props.clearStorageError();
    this.props.clearVolumeError();
    this.setState({
      isCreatingStorage: false,
      isCreatingVolume: false,
      storageFields: this.storageFactory(),
      volumeFields: this.volumeFactory()
    });
  };

  protected handleStorageSubmit = () => {
    const { tabKey } = this.state;
    const { formatMessage } = this.props.intl;

    switch (tabKey) {
      case 'storage':
        this.props.clearStorageError();
        this.props
          .addStorage(this.getFlatFormFieldValue(
            'storageFields'
          ) as StorageFields)
          .then(() => {
            if (!this.props.storages.error) {
              this.setState({
                isCreatingStorage: false,
                storageFields: this.storageFactory()
              });
              notification.success({
                message: formatMessage({
                  id: 'action.success'
                }),
                description: formatMessage({
                  id: 'storage.hint.create.success'
                })
              });
            } else {
              notification.error({
                message: formatMessage({
                  id: 'action.failure'
                }),
                description:
                  formatMessage({
                    id: 'storage.hint.create.failure'
                  }) +
                  ' (' +
                  this.props.storages.error.message +
                  ')'
              });
            }
          });
        break;

      case 'volume':
        this.props.clearVolumeError();
        this.props
          .addVolume(this.getFlatFormFieldValue('volumeFields') as VolumeFields)
          .then(() => {
            if (!this.props.volumes.error) {
              this.setState({
                isCreatingVolume: false,
                volumeFields: this.volumeFactory()
              });
              notification.success({
                message: formatMessage({
                  id: 'action.success'
                }),
                description: formatMessage({
                  id: 'volume.hint.create.success'
                })
              });
            } else {
              notification.error({
                message: formatMessage({
                  id: 'action.failure'
                }),
                description:
                  formatMessage({
                    id: 'volume.hint.create.failure'
                  }) +
                  ' (' +
                  this.props.volumes.error.message +
                  ')'
              });
            }
          });
        break;
    }
  };

  public renderTableHeader = () => {
    const { tabKey } = this.state;
    return (
      <Button onClick={this.handleAddItem}>
        <Icon type="plus" /> <FormattedMessage id={`${tabKey}.add`} />
      </Button>
    );
  };

  protected getStorageInfo = (storages: Array<StorageModel>) => {
    return storages.map(storage => {
      const displayName =
        storage.createdBy === undefined
          ? 'none'
          : storage.createdBy!.displayName;
      return {
        id: storage.id,
        name: storage.name,
        owner: displayName,
        type: storage.type,
        storageClassName: storage.storageClassName,
        ip: storage.ip,
        path: storage.path
      };
    });
  };

  protected getVoulmeInfo = (volumes: Array<VolumeModel>) => {
    return volumes.map(volume => {
      const displayName =
        volume.createdBy === undefined ? 'none' : volume.createdBy!.displayName;
      return {
        id: volume.id,
        name: volume.name,
        namespace: volume.namespace,
        storageName: volume.storageName,
        owner: displayName,
        accessMode: volume.accessMode,
        capacity: volume.capacity
      };
    });
  };

  public renderTabContent = () => {
    const {
      storages,
      volumes,
      clearStorageError,
      clearVolumeError
    } = this.props;

    const {
      tabKey,
      storageFields,
      volumeFields,
      namespaces,
      isCreatingStorage,
      isCreatingVolume
    } = this.state;

    const storageOptions = storages.data.map(storage => storage.name);

    switch (tabKey) {
      case 'storage':
        return (
          <React.Fragment>
            <Table
              rowKey="id"
              columns={this.storageColumns}
              dataSource={this.getStorageInfo(storages.data)}
              className="main-table"
            />
            <StorageForm
              {...storageFields}
              visiable={isCreatingStorage}
              isLoading={storages.isLoading}
              error={storages.error}
              onCancel={this.handleFormClose}
              onChange={this.handleFormChange('storageFields')}
              onSubmit={this.handleStorageSubmit}
              onCloseError={clearStorageError}
            />
          </React.Fragment>
        );
      case 'volume':
        return (
          <React.Fragment>
            <Table
              rowKey="id"
              columns={this.volumeColumns}
              dataSource={this.getVoulmeInfo(volumes.data)}
              className="main-table"
            />
            <VolumeForm
              {...volumeFields}
              visiable={isCreatingVolume}
              isLoading={volumes.isLoading}
              error={volumes.error}
              namespaces={namespaces}
              storageNameOptions={storageOptions}
              onCancel={this.handleFormClose}
              onChange={this.handleFormChange('volumeFields')}
              onSubmit={this.handleStorageSubmit}
              onCloseError={clearVolumeError}
            />
          </React.Fragment>
        );
      default:
        return null;
    }
  };

  public render() {
    const { tabKey } = this.state;

    return (
      <div>
        <Card
          className={styles.card}
          tabList={tabList}
          activeTabKey={tabKey}
          onTabChange={key => {
            this.setState({ tabKey: key });
          }}
          title={<CapitalizedMessage id="storage" />}
          extra={this.renderTableHeader()}
        >
          {this.renderTabContent()}
        </Card>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState) => {
  return {
    storages: {
      data: state.storage.storages,
      isLoading: state.storage.isLoading,
      error: state.storage.error
    },
    volumes: {
      data: state.volume.volumes,
      isLoading: state.volume.isLoading,
      error: state.volume.error
    }
  };
};

const mapDispatchToProps = (dispatch: RTDispatch & Dispatch<RootAction>) => ({
  fetchStorages: () => dispatch(storageOperations.fetchStorage()),
  fetchVolumes: () => dispatch(volumeOperations.fetchVolumes()),
  addStorage: (data: StorageFields) =>
    dispatch(storageOperations.addStorage(data)),
  addVolume: (data: VolumeFields) => dispatch(volumeOperations.addVolume(data)),
  removeStorage: (id: string) => dispatch(storageOperations.removeStorage(id)),
  removeVolume: (id: string) => dispatch(volumeOperations.removeVolume(id)),
  clearStorageError: () => dispatch(storageActions.clearStorageError()),
  clearVolumeError: () => dispatch(volumeActions.clearVolumeError())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(Storage));
