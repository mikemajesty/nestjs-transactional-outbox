import { z, ZodError, ZodIssue } from "zod";

export const InputValidator = z;

export type LocaleInput =
  | 'ar'
  | 'cs'
  | 'en'
  | 'fa'
  | 'fr'
  | 'hr-HR'
  | 'is'
  | 'ja'
  | 'lt'
  | 'nl'
  | 'pt'
  | 'ru'
  | 'sv'
  | 'uk-UA'
  | 'zh-CN'
  | 'bg'

export type Infer<T extends z.ZodType> = z.infer<T>;

export type ZodException = ZodError;
export type ZodExceptionIssue = ZodIssue;

export type ZodOptionalType<T> = z.ZodOptional<z.ZodType<NonNullable<T>>>;

export type ZodOptionalPipeline<T> = z.ZodPipeline<z.ZodOptional<z.ZodType<unknown>>, z.ZodType<T>>;

export type ZodSchema<T> = z.ZodType<T> | z.ZodPipeline<z.ZodType<unknown>, z.ZodType<T>>;
