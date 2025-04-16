import { BaseException } from '../../utils/exception';

export type MessageType = {
  message: string;
  context?: string;
  obj?: object;
};

export type ErrorType = Error & BaseException & any;

export enum LogLevelEnum {
  fatal = 'fatal',
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
  trace = 'trace',
  silent = 'silent'
}
