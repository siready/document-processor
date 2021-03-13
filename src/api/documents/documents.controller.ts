import database from "../../infrastructure/database/database";
import broker from "../../infrastructure/broker/broker";
import { DocumentService } from "../../domain/documents/document.service";
import { CreateDocument } from "./models/createDocument.command";
import { IDocumentDto } from "./models/document.dto";
import { DocumentMapper } from "./mappers/document.mapper";
import { DocumentReferenceService } from "../../domain/documents/documentReference.service";
import { DocumentQueueService } from "../../domain/documents/document.queue.service";
import { DocumentRequested } from "../../events/documents/documentRequested.event";

export class DocumentsController
{
	public async getDocuments(): Promise<IDocumentDto[]>
	{
		var result = await this.documentService.getList();
		return DocumentMapper.toDtoList(result);
	}

  public async createDocument(body: CreateDocument): Promise<void>
	{
		var exists = await this.documentReferenceService.exists(body.url);

		// in case reference already exists, processing is not needed
		if (exists) {
			// TODO: http exception
			throw new Error("Already exists");
		}

		// TODO: use transactional outbox pattern instead of sending directly to broker
		// - in this case this would mean:
		// 	- add a new record to DatabaseReference
		//	- add a new outbox event

		// send to queue
		await this.documentQueueService.create(
			new DocumentRequested(body.url)
		)
	}

	private get documentService(): DocumentService {
		return new DocumentService(
			database.getDocumentRepository()
		);
	}

	private get documentReferenceService(): DocumentReferenceService {
		return new DocumentReferenceService(
			database.getDocumentReferencesRepository()
		);
	}

	private get documentQueueService(): DocumentQueueService {
		return new DocumentQueueService(
			broker.getDocumentRequestedProducer()
		);
	}
}
