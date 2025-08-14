import React from 'react';
import { motion } from 'framer-motion';
import {
  BoltIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ChartPieIcon,
  UserGroupIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: BoltIcon,
    title: 'Lightning-Fast Processing',
    description: 'Process millions of data points in real-time with our optimized engine.',
    color: 'bg-yellow-500',
  },
  {
    icon: CpuChipIcon,
    title: 'Neural Network Analysis',
    description: 'Deep learning models analyze player psychology and team dynamics.',
    color: 'bg-purple-500',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure & Compliant',
    description: 'Enterprise-grade security with full GDPR and data compliance.',
    color: 'bg-green-500',
  },
  {
    icon: ChartPieIcon,
    title: 'Advanced Visualizations',
    description: 'Interactive dashboards with 3D heat maps and predictive modeling.',
    color: 'bg-blue-500',
  },
  {
    icon: UserGroupIcon,
    title: 'Team Collaboration',
    description: 'Share insights and collaborate with coaches and analysts in real-time.',
    color: 'bg-indigo-500',
  },
  {
    icon: CloudArrowUpIcon,
    title: 'Cloud-Native Architecture',
    description: 'Scalable infrastructure that grows with your needs.',
    color: 'bg-pink-500',
  },
];

const Features: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Powerful Features for Modern Sports Analytics
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Everything you need to gain a competitive edge with data-driven insights
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;