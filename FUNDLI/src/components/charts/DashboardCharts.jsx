import React from 'react';
import ChartComponent, { chartOptions, colorPalettes } from './ChartComponent';

// Loan Trends Chart
export const LoanTrendsChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Loans Applied',
        data: data?.applied || [12, 19, 3, 5, 2, 3],
        borderColor: colorPalettes.primary[0],
        backgroundColor: colorPalettes.primary[0] + '20',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Loans Approved',
        data: data?.approved || [8, 15, 2, 4, 1, 2],
        borderColor: colorPalettes.success[0],
        backgroundColor: colorPalettes.success[0] + '20',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Loans Funded',
        data: data?.funded || [6, 12, 1, 3, 1, 1],
        borderColor: colorPalettes.warning[0],
        backgroundColor: colorPalettes.warning[0] + '20',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const options = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Loan Trends Over Time'
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="h-80">
        <ChartComponent type="line" data={chartData} options={options} />
      </div>
    </div>
  );
};

// Portfolio Breakdown Chart
export const PortfolioBreakdownChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Active Loans', 'Completed Loans', 'Pending Loans', 'Defaulted Loans'],
    datasets: [
      {
        data: data?.values || [45, 30, 15, 10],
        backgroundColor: colorPalettes.gradient,
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }
    ]
  };

  const options = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Portfolio Breakdown'
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="h-80">
        <ChartComponent type="doughnut" data={chartData} options={options} />
      </div>
    </div>
  );
};

// Monthly Performance Chart
export const MonthlyPerformanceChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: data?.revenue || [5000, 7500, 6200, 8900, 11000, 9500],
        backgroundColor: colorPalettes.success[0] + '80',
        borderColor: colorPalettes.success[0],
        borderWidth: 2
      },
      {
        label: 'Expenses',
        data: data?.expenses || [2000, 3000, 2500, 3500, 4000, 3800],
        backgroundColor: colorPalettes.danger[0] + '80',
        borderColor: colorPalettes.danger[0],
        borderWidth: 2
      }
    ]
  };

  const options = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Monthly Performance'
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="h-80">
        <ChartComponent type="bar" data={chartData} options={options} />
      </div>
    </div>
  );
};

// Credit Score Distribution Chart
export const CreditScoreDistributionChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Excellent (750+)', 'Good (700-749)', 'Fair (650-699)', 'Poor (600-649)', 'Very Poor (<600)'],
    datasets: [
      {
        data: data?.values || [25, 35, 20, 15, 5],
        backgroundColor: [
          colorPalettes.success[0],
          colorPalettes.primary[0],
          colorPalettes.warning[0],
          colorPalettes.danger[0],
          colorPalettes.purple[0]
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const options = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Credit Score Distribution'
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="h-80">
        <ChartComponent type="pie" data={chartData} options={options} />
      </div>
    </div>
  );
};

// Repayment Status Chart
export const RepaymentStatusChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['On Time', 'Late', 'Overdue', 'Paid'],
    datasets: [
      {
        data: data?.values || [70, 15, 10, 5],
        backgroundColor: [
          colorPalettes.success[0],
          colorPalettes.warning[0],
          colorPalettes.danger[0],
          colorPalettes.primary[0]
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const options = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Repayment Status Distribution'
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="h-80">
        <ChartComponent type="doughnut" data={chartData} options={options} />
      </div>
    </div>
  );
};

// Investment Growth Chart
export const InvestmentGrowthChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Total Investment',
        data: data?.investment || [10000, 15000, 22000, 30000],
        borderColor: colorPalettes.primary[0],
        backgroundColor: colorPalettes.primary[0] + '20',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Returns Earned',
        data: data?.returns || [500, 1200, 2000, 3200],
        borderColor: colorPalettes.success[0],
        backgroundColor: colorPalettes.success[0] + '20',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const options = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Investment Growth Over Time'
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="h-80">
        <ChartComponent type="line" data={chartData} options={options} />
      </div>
    </div>
  );
};

// Risk Assessment Chart
export const RiskAssessmentChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [
      {
        data: data?.values || [60, 30, 10],
        backgroundColor: [
          colorPalettes.success[0],
          colorPalettes.warning[0],
          colorPalettes.danger[0]
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const options = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: 'Risk Assessment Distribution'
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="h-80">
        <ChartComponent type="pie" data={chartData} options={options} />
      </div>
    </div>
  );
};
