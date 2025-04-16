import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { KafkaContext } from '@nestjs/microservices';

@Injectable()
export class KafkaExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const kafkaContext = context.switchToRpc().getContext<KafkaContext>();
        const topic = kafkaContext.getTopic();
        const partition = kafkaContext.getPartition();
        const offset = kafkaContext.getMessage().offset;

        console.error(
          `Erro no Kafka Consumer - Topic: ${topic}, Partition: ${partition}, Offset: ${offset}`,
          error,
        );

        // Se for um erro transitório, permite o retry automático do Kafka
        if (this.isRetriableError(error)) {
          console.log('Erro transitório detectado, deixando Kafka reprocessar.');
          return throwError(() => error);
        }

        // Se for um erro com status < 500, impedimos retry automático
        console.log('Erro não crítico detectado, consumindo a mensagem.');
        return new Observable(); // Evita retry
      }),
    );
  }

  private isRetriableError(error: any): boolean {
    const retriableErrors = ['ECONNRESET', 'ETIMEDOUT'];

    // Se for erro de rede, deixa o Kafka reprocessar
    if (retriableErrors.some((msg) => error.message?.includes(msg))) {
      return true;
    }

    // Se o erro tem status code menor que 500, consumimos a mensagem e evitamos retry
    const statusCode = (error as { status?: number }).status;
    if (statusCode !== undefined && statusCode < 500) {
      return false; // Não queremos retry nesses casos
    }

    return true; // Outros erros (>500) são tratados como retentáveis
  }
}
