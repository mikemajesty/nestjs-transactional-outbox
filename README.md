POST: http://localhost:8083/connectors
{
"name": "mongo-connector",
"config": {
"connector.class": "io.debezium.connector.mongodb.MongoDbConnector",
"mongodb.connection.string": "mongodb://nestjs-microservice-primary:27017/?replicaSet=app",
"mongodb.name": "order-db",
"database.include.list": "order-db",
"collection.include.list": "order-db.outbox",
"tasks.max": "1",
"topic.prefix": "dbz",
"snapshot.mode": "initial",

    "transforms.unwrap.remove.fields": "deletedAt,updatedAt,lastAttemptAt",

    "transforms": "unwrap,setKey",
    "transforms.unwrap.type": "io.debezium.connector.mongodb.transforms.ExtractNewDocumentState",
    "transforms.unwrap.drop.tombstones": "true",
    "transforms.unwrap.delete.handling.mode": "rewrite",
    "transforms.flatten.delimiter": "_",
    "transforms.setKey.type": "org.apache.kafka.connect.transforms.ValueToKey",
    "transforms.setKey.fields": "aggregateId",
    "key.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "key.converter.schemas.enable": "false",
    "value.converter.schemas.enable": "false",
    "topic.creation.groups": "dbz-order-db",
    "topic.creation.default.replication.factor": "1",
    "topic.creation.default.partitions": "1",
    "errors.tolerance": "all",
    "errors.log.enable": "true",
    "errors.deadletterqueue.topic.name": "dead-letter-topic",
    "errors.deadletterqueue.context.headers.enable": "true",
    "field.name.adjustment.mode": "avro",
    "sanitize.field.names": "true",
    "database.history.logging.enabled": "true",

    "log.connection.messages": "true",
    "mongodb.log.connection": "true"

}
}
