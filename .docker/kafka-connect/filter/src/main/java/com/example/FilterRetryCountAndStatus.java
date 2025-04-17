package com.example;

import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.connect.connector.ConnectRecord;
import org.apache.kafka.connect.transforms.Transformation;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.source.SourceRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

public class FilterRetryCountAndStatus<R extends ConnectRecord<R>> implements Transformation<R> {

    private static final Logger log = LoggerFactory.getLogger(FilterRetryCountAndStatus.class);

    @Override
    public R apply(R record) {
        if (record == null || record.value() == null) {
            return record;
        }

        if (record.value() instanceof Struct) {
            Struct value = (Struct) record.value();

            Integer retryCount = null;
            String status = null;

            try {
                retryCount = value.getInt32("retryCount");
            } catch (Exception e) {
                log.debug("Campo retryCount não encontrado ou inválido.");
            }

            try {
                status = value.getString("status");
            } catch (Exception e) {
                log.debug("Campo status não encontrado ou inválido.");
            }

            if ((retryCount != null && retryCount > 5) || "failed".equalsIgnoreCase(status)) {
                log.debug("Evento descartado. retryCount={}, status={}", retryCount, status);
                return null;
            }
        } else {
            log.debug("Valor não é um Struct: {}", record.value().getClass().getSimpleName());
        }

        return record;
    }

    @Override
    public ConfigDef config() {
        return new ConfigDef(); // Pode adicionar configurações customizadas aqui se quiser
    }

    @Override
    public void configure(Map<String, ?> configs) {
        // Pode receber configurações do .properties, se definido
    }

    @Override
    public void close() {
        // Limpeza se necessário
    }
}

