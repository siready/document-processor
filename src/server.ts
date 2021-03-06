import App from './app';

class Main {

	private readonly app = new App();

	async initialize(): Promise<void> {
		await this.app.initialize();
		this.app.listen();
	}

}

const main = new Main();
main.initialize();
