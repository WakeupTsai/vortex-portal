import * as React from 'react';
import { injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

import { Modal, Form, Select, Input, Alert } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { VolumeFields, AccessMode } from '@/models/Storage';
import * as NamespaceModel from '@/models/Namespace';
import { FormField } from '@/utils/types';
import withCapitalize from '@/containers/withCapitalize';
import { toTitleCase } from '@/utils/string';

const CapitalizedMessage = withCapitalize(FormattedMessage);
const FormItem = Form.Item;
const Option = Select.Option;

interface VolumeFormProps extends FormComponentProps, FormField<VolumeFields> {
  visiable: boolean;
  isLoading: boolean;
  error: Error | null;
  namespaces: Array<NamespaceModel.Namespace>;
  storageNameOptions: Array<string>;
  onCancel: () => void;
  onChange: (changedFields: any) => void;
  onSubmit: () => void;
  onCloseError: () => void;
}

const fieldRequiredRule = (field: string) => {
  return {
    required: true,
    message: (
      <FormattedMessage
        id="form.message.required"
        values={{
          field: <FormattedMessage id={`volume.${field}`} />
        }}
      />
    )
  };
};

class VolumeForm extends React.PureComponent<
  VolumeFormProps & InjectedIntlProps,
  object
> {
  protected handleClose = () => {
    this.props.onCancel();
  };

  public render() {
    const {
      visiable,
      error,
      isLoading,
      storageNameOptions,
      onSubmit,
      onCloseError
    } = this.props;
    const { getFieldDecorator } = this.props.form;

    return (
      <Modal
        title={<CapitalizedMessage id="volume.form.createNewVolume" />}
        visible={visiable}
        confirmLoading={isLoading}
        okText={toTitleCase(
          this.props.intl.formatMessage({ id: 'action.create' })
        )}
        onCancel={this.handleClose}
        onOk={onSubmit}
      >
        {error && (
          <Alert
            type="error"
            showIcon={true}
            closable={true}
            message="Created Failed"
            description={error.message}
            onClose={onCloseError}
          />
        )}
        <Form>
          <FormItem label={<CapitalizedMessage id="volume" />} required={true}>
            {getFieldDecorator('name', {
              rules: [fieldRequiredRule('name')]
            })(<Input />)}
          </FormItem>
          <FormItem label={<CapitalizedMessage id="namespace" />}>
            {getFieldDecorator('namespace', {
              rules: [
                {
                  required: true
                }
              ]
            })(
              <Select>
                <Option value="default">default</Option>
                {this.props.namespaces.map(namespace => {
                  return (
                    <Option key={namespace.name} value={namespace.name}>
                      {namespace.name}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
          <FormItem
            label={<CapitalizedMessage id="volume.storageName" />}
            required={true}
          >
            {getFieldDecorator('storageName', {
              rules: [fieldRequiredRule('storageName')]
            })(
              <Select>
                {storageNameOptions.map(option => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem
            label={<CapitalizedMessage id="volume.accessMode" />}
            required={true}
          >
            {getFieldDecorator('accessMode', {
              rules: [fieldRequiredRule('accessMode')]
            })(
              <Select>
                {Object.keys(AccessMode).map(mode => (
                  <Option
                    key={mode}
                    value={mode}
                    disabled={mode !== AccessMode.ReadWriteMany}
                  >
                    {mode.replace(/([A-Z])/g, ' $1').trim()}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create({
  onFieldsChange(props: VolumeFormProps, changedFields) {
    props.onChange(changedFields);
  },
  mapPropsToFields(props: VolumeFormProps) {
    return {
      name: Form.createFormField({
        ...props.name,
        value: props.name.value
      }),
      namespace: Form.createFormField({
        ...props.namespace,
        value: props.namespace.value
      }),
      storageName: Form.createFormField({
        ...props.storageName,
        value: props.storageName.value
      }),
      accessMode: Form.createFormField({
        ...props.accessMode,
        value: props.accessMode.value
      })
    };
  }
})(injectIntl(VolumeForm));
