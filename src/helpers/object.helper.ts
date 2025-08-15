import _ from 'lodash';
import { jsonrepair } from 'jsonrepair';

export class ObjectUtility {
  static readonly CAMEL_CASE = 'camel';
  static readonly SNAKE_CASE = 'snake';

  public static convertKeys(
    subject: any,
    toCase: string = ObjectUtility.SNAKE_CASE
  ) {
    if (subject) {
      if (_.isEmpty(subject)) {
        return subject;
      }
      try {
        const data: any = this.convertKeysCase(subject, toCase);
        return data;
      } catch (exception) {
        return exception;
      }
    }
  }

  public static convertKeysCase(
    subject: any,
    toCase: string = ObjectUtility.SNAKE_CASE
  ) {
    if (subject) {
      if (_.isEmpty(subject)) {
        return subject;
      }
      try {
        const keys: string[] = Object.keys(subject);
        const data: any = {};
        keys.forEach((key) => {
          switch (toCase) {
            case ObjectUtility.SNAKE_CASE:
              data[_.snakeCase(key)] = subject[key];
              break;
            case ObjectUtility.CAMEL_CASE:
              data[_.camelCase(key)] = subject[key];
              break;
          }
        });
        return data;
      } catch (exception) {
        return exception;
      }
    }
  }

  public static convertArrayKeysCase(
    subject: any,
    toCase: string = ObjectUtility.SNAKE_CASE
  ) {
    if (subject) {
      if (_.isEmpty(subject)) {
        return subject;
      }
      if (_.isArray(subject)) {
        return (subject as []).map((item) => {
          return this.convertKeys(item, toCase);
        });
      } else {
        return this.convertKeys(subject, toCase);
      }
    }
  }

  public static toJSON(subject: string) {
    let JSONObject: any;
    JSONObject = JSON.parse(jsonrepair(subject));
    return JSONObject;
  }

  public static removeEmpty(subject: any) {
    if (subject) {
      try {
        const keys: string[] = Object.keys(subject);
        keys.forEach((key) => {
          if (_.isEmpty(subject[key])) {
            delete subject[key];
          }
        });
        return subject;
      } catch (exception) {
        return exception;
      }
    }
  }

  public static camelCaseToSentenceCase(camelCase: string): string {
    const result = camelCase.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  public static convertAttributesToSentenceCase(objArray: any[]): any[] {
    return objArray.map((obj) => {
      const newObj: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const sentenceCaseKey = ObjectUtility.camelCaseToSentenceCase(key);
          newObj[sentenceCaseKey] = obj[key];
        }
      }
      return newObj;
    });
  }

  public static convertToSnakeCaseArray(strings: string[]): string[] {
    const snakeCaseArray: string[] = [];
    for (const str of strings) {
      const snakeCaseStr = str.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeCaseArray.push(snakeCaseStr);
    }
    return snakeCaseArray;
  }

  public static camelCaseToSnake(camelCase: string): string {
    return camelCase.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
  }

  public static toCamelCase(value: string): string {
    return _.camelCase(value);
  }

  public static removeNullFromData(data: any) {
    data = JSON.parse(JSON.stringify(data), (key, value) => {
      return value === null || value === 'null' ? '' : value;
    });
    return data;
  }

  public static convertSnakeCaseKeysToCamelCaseKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        ObjectUtility.convertSnakeCaseKeysToCamelCaseKeys(item)
      );
    }
    return Object.keys(obj).reduce((acc: Record<string, any>, key) => {
      const camelCaseKey = key.replace(/_([a-z])/g, (_, group1) =>
        group1.toUpperCase()
      );
      const value = obj[key];
      acc[camelCaseKey] =
        typeof value === 'object'
          ? ObjectUtility.convertSnakeCaseKeysToCamelCaseKeys(value)
          : value;
      return acc;
    }, {} as Record<string, any>);
  }

  public static sanitizeXMLToJSON<T>(obj: any): T {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeXMLToJSON(item)) as T;
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj: Record<string, any> = {};
      for (const key in obj) {
        if (key === '_') {
          return obj[key];
        } else {
          newObj[key] = this.sanitizeXMLToJSON(obj[key]);
        }
      }
      return newObj as T;
    }
    return obj;
  }

  public static removeNamespacePrefixFromEIBResponses<T>(obj: unknown): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        ObjectUtility.removeNamespacePrefixFromEIBResponses(item)
      );
    }
    const newObj: Record<string, any> = {};
    for (const key in obj as Record<string, any>) {
      let newKey = key;
      newKey = newKey.replace(/^ns:/, '');
      newKey = newKey.replace(/^ns1:/, '');
      newKey = newKey.replace(/^ns0:/, '');
      newKey = newKey.replace(/^ns2:/, '');
      newKey = newKey.replace(/^ns3:/, '');
      newKey = newKey.replace(/^dnp:/, '');
      newKey = newKey.replace(/^acc:/, '');
      newKey = newKey.replace(/^act:/, '');
      newKey = newKey.replace(/^tns4:/, '');
      newKey = newKey.replace(/:net$/, '');
      const objValue = (obj as Record<string, any>)[key];
      if (
        typeof objValue === 'object' &&
        objValue &&
        objValue._ !== undefined
      ) {
        newObj[newKey] = objValue._;
      } else {
        newObj[newKey] =
          typeof objValue === 'object'
            ? ObjectUtility.removeNamespacePrefixFromEIBResponses(objValue)
            : objValue;
      }
    }
    return newObj;
  }
}
