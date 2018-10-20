/* eslint-disable no-param-reassign,no-underscore-dangle */
// Imports the Google Cloud client library
import monitoring from '@google-cloud/monitoring';
// Creates a client
const client = new monitoring.MetricServiceClient();
const projectId = 'hackpsu18';
const BASE_STACKDRIVER_URL = 'custom.googleapis.com/hackpsu18/';

module.exports = class Metric {

  public static dataPoint(data) {
    const dataPoint = {
      interval: {
        endTime: {
          seconds: Date.now() / 1000,
        },
      },
      value: {
        doubleValue: data,
      },
    };
    return dataPoint;
  }
  private readonly name: string;
  private description: any;
  private readonly unit: string;
  private readonly type: string;
  private labels: any;
  /**
   * @param name
   * @param description
   * @param unit
   * @param labels {Array}
   */
  constructor(name, description, unit, labels) {
    if (!name) {
      throw new Error('Name must be provided');
    }
    this.name = name;
    this.description = !description ? name : description;
    this.unit = unit || '{number}';
    this.type = `${BASE_STACKDRIVER_URL}${this.name}`;
    this.labels = labels;
  }

  public instantiate() {
    const request = {
      metricDescriptor: {
        description: this.description,
        displayName: this.name,
        metricKind: 'GAUGE',
        type: this.type,
        unit: this.unit,
        valueType: 'DOUBLE',
      },
      name: client.projectPath(projectId),
    };
    return client.createMetricDescriptor(request)
      .then((results) => {
        [this.description] = results;
        return Promise.resolve();
      });
  }

  public track(data, labels) {
    const dataPoint = Metric.dataPoint(data);
    const timeSeriesData = this.timeSeriesData(labels, dataPoint);
    const request = {
      name: client.projectPath(projectId),
      timeSeries: [timeSeriesData],
    };
    return client
      .createTimeSeries(request);
  }

  public timeSeriesData(labels, dataPoint) {
    const timeSeriesData = {
      metric: {
        labels,
        type: this.type,
      },
      points: [dataPoint],
      resource: {
        labels: {
          project_id: projectId,
        },
        type: 'global',
      },
    };
    return timeSeriesData;
  }
};
