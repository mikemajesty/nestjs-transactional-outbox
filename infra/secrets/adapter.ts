export abstract class ISecretsAdapter {
  ENV!: string;

  LOG_LEVEL!: string;

  DATE_FORMAT!: string;

  TZ!: string;

  IS_LOCAL!: boolean;

  IS_PRODUCTION!: boolean;

  POSTGRES!: {
    INVENTORY_URL: string
  }

  MONGO!: {
    ORDER_URL: string
  }
}
