import { ConsumerConfig, Kafka } from 'kafkajs';
import { kafkaConfig } from "../config/kafka.config";
import { environment as env, environment, devEnvironment } from "./../environment/environment";
import { UuidUtils } from '../utils/uuid.utils';
import { DocumentRequestedProducer } from './queues/documentRequestedQueue/documentRequested.producer';
import { DocumentRequestedConsumer } from './queues/documentRequestedQueue/documentRequested.consumer';
import { DocumentCreatedProducer } from './queues/documentCreatedQueue/documentCreated.producer';
import { DocumentCreatedConsumer } from './queues/documentCreatedQueue/documentCreated.consumer';

const kafka = new Kafka({
	clientId: kafkaConfig[env].clientId,
	brokers: kafkaConfig[env].brokers || [],
});

const consumerConfig: ConsumerConfig = (environment === devEnvironment)
	? { groupId: `${kafkaConfig[env].clientId}-group-${UuidUtils.getUuid().toString()}` }
	: { groupId: `${kafkaConfig[env].clientId}-group` };

class Broker {
	// document requested
	private readonly documentRequestedConsumer = new DocumentRequestedConsumer(kafka.consumer(consumerConfig));
	private readonly documentRequestedProducer = new DocumentRequestedProducer(kafka.producer());
	// document created
	private readonly documentCreatedConsumer = new DocumentCreatedConsumer(kafka.consumer(consumerConfig));
	private readonly documentCreatedProducer = new DocumentCreatedProducer(kafka.producer());

	public async initialize(): Promise<void> {
		await this.documentRequestedConsumer.connect();
		await this.documentRequestedProducer.connect();
		await this.documentCreatedConsumer.connect();
		await this.documentCreatedProducer.connect();
		await this.initializeConsumers();
	}

	public getDocumentRequestedProducer(): DocumentRequestedProducer {
		return this.documentRequestedProducer;
	}

	public getDocumentCreatedProducer(): DocumentCreatedProducer {
		return this.documentCreatedProducer;
	}

	private async initializeConsumers(): Promise<void> {
		await this.documentRequestedConsumer.initialize();
	}
}

export default new Broker();
