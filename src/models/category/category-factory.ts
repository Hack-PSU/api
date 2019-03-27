import _ from 'lodash';
import { IApiModel } from '../../services/database';
import { ObjectFactory } from '../object-factory';
import { Category } from './category';

export interface ICategoryApiModel extends IApiModel<Category> {
  uid: number;
  categoryName: string;
  isSponsor: boolean;
}

export class CategoryFactory extends ObjectFactory<Category> {
  public generateApiRepresentation(data: Category): ICategoryApiModel {
    return data.cleanRepresentation as ICategoryApiModel;
  }

  public generateDbRepresentation(data: Category): any {
    return data.dbRepresentation;
  }

  public generateFromApi(data: ICategoryApiModel): Category {
    return new Category()
      .setUid(data.uid)
      .setCategoryName(data.categoryName)
      .setIsSponsor(data.isSponsor);
  }

  public generateFromDbRepresentation(data: any): Category {
    return _.merge(new Category(), data);
  }
}
