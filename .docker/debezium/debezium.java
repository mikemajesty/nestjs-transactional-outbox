public class FilterRetryCountAndStatus implements Transformation<SourceRecord> {

  @Override
  public SourceRecord apply(SourceRecord record) {
      Struct value = (Struct) record.value();
      if (value != null) {
          Integer retryCount = value.getInt32("retryCount");
          String status = value.getString("status");

          if ((retryCount != null && retryCount > 5) || "failed".equalsIgnoreCase(status)) {
              // Descarta o evento
              return null;
          }
      }
      return record;
  }

  // Implementações dos métodos config(), close() e version() conforme necessário
}
