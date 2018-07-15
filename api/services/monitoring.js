/* eslint-disable no-param-reassign,no-underscore-dangle */
// Imports the Google Cloud client library
const monitoring = require('@google-cloud/monitoring');

// Creates a client
const client = new monitoring.MetricServiceClient();
const projectId = 'hackpsu18';
const BASE_STACKDRIVER_URL = 'custom.googleapis.com/hackpsu18/';

module.exports = class Metric {
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
    if (!description) {
      this.description = name;
    } else {
      this.description = description;
    }
    this.unit = unit || '{number}';
    this.type = `${BASE_STACKDRIVER_URL}${this.name}`;
    this.labels = labels;
  }

  static dataPoint(data) {
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

  instantiate() {
    const request = {
      name: client.projectPath(projectId),
      metricDescriptor: {
        description: this.description,
        displayName: this.name,
        type: this.type,
        metricKind: 'GAUGE',
        valueType: 'DOUBLE',
        unit: this.unit,
      },
    };
    return client.createMetricDescriptor(request)
      .then((results) => {
        [this._descriptor] = results;
        return Promise.resolve();
      });
  }

  track(data, labels) {
    const dataPoint = Metric.dataPoint(data);
    const timeSeriesData = this.timeSeriesData(labels, dataPoint);
    const request = {
      name: client.projectPath(projectId),
      timeSeries: [timeSeriesData],
    };
    return client
      .createTimeSeries(request);
  }

  timeSeriesData(labels, dataPoint) {
    const timeSeriesData = {
      metric: {
        type: this.type,
        labels,
      },
      resource: {
        type: 'global',
        labels: {
          project_id: projectId,
        },
      },
      points: [dataPoint],
    };
    return timeSeriesData;
  }
};
