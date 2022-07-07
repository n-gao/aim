import { RequestStatusEnum } from 'config/enums/requestStatusEnum';

import { IModel, State } from 'types/services/models/model';

import onNotificationAdd from './onNotificationAdd';

export default function exceptionHandler<M extends State>({
  detail,
  model,
}: {
  detail: any;
  model: IModel<M>;
}) {
  let message = '';
  let state: Record<any, any> = {
    requestStatus: RequestStatusEnum.BadRequest,
  };
  const modelState: any = model.getState();
  const { advancedMode } = modelState!.config!.select;
  const OffsetDiff = advancedMode ? 1 : 2;

  detail.detail.offset = detail.detail.offset - OffsetDiff;
  if (detail.detail.end_offset) {
    detail.detail.end_offset = detail.detail.end_offset - OffsetDiff;
  }

  const { offset, end_offset, line } = detail.detail;

  if (detail.message === 'SyntaxError' && modelState) {
    message = `Query syntax error at line (${line}, ${offset}${
      end_offset && end_offset !== offset ? `-${end_offset}` : ''
    })`;
    state = {
      ...state,
      selectFormData: {
        ...modelState.selectFormData,
        [advancedMode ? 'advancedError' : 'error']: {
          ...detail,
          message,
        },
      },
    };
    model.setState(state);
    return;
  } else {
    message = detail.message || 'Something went wrong';
  }

  model.setState(state);
  onNotificationAdd({
    notification: {
      id: Date.now(),
      severity: 'error',
      messages: [message],
    },
    model,
  });
}
