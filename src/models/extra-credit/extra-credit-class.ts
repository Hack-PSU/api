import BaseObject from '../BaseObject';

export class ExtraCreditClass extends BaseObject {

  public get id() {
    return this.uid;
  }

  protected get schema(): any {
    return undefined;
  }
  public readonly uid: number;
  public readonly class_name: string;

  constructor(data: { class_name: string }) {
    super();
    this.class_name = data.class_name;
  }

  public validate(): { result: boolean; error?: string } {
    const result = typeof this.class_name === 'string';
    if (!result) {
      return { result, error: 'Class name must be of type string' };
    }
    return { result: true };
  }
}
