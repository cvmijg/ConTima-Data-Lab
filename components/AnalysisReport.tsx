import React from 'react';
import { AnalysisResult } from '../types';
import { FileCheck, TrendingUp, Users, DollarSign, Image, Layers, CheckCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalysisReportProps {
  data: AnalysisResult;
}

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; colorClass: string }> = ({ icon, title, colorClass }) => (
  <div className={`flex items-center space-x-3 mb-6 pb-2 border-b-2 ${colorClass}`}>
    {icon}
    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
  </div>
);

// Simple Markdown-like renderer for the text blocks
const MarkdownText: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;
  
  // Basic parsing: split by lines
  const lines = content.split('\n');
  return (
    <div className="space-y-3 text-slate-700 leading-relaxed">
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) return <h3 key={idx} className="text-lg font-semibold mt-4 mb-2 text-slate-800">{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h3 key={idx} className="text-lg font-semibold mt-4 mb-2 text-slate-800">{line.replace('## ', '')}</h3>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={idx} className="flex items-start ml-4"><span className="mr-2">•</span><span>{line.substring(2)}</span></div>;
        if (line.trim() === '') return <br key={idx} />;
        // Bold parsing (simple)
        const parts = line.split('**');
        if (parts.length > 1) {
            return (
                <p key={idx}>
                    {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900">{part}</strong> : part)}
                </p>
            )
        }
        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
};

const AnalysisReport: React.FC<AnalysisReportProps> = ({ data }) => {
  // Chart Colors Palette
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      
      {/* 1. Files Detected */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <SectionHeader 
          icon={<FileCheck className="text-indigo-600" size={28} />} 
          title="Files Detected & Classified" 
          colorClass="border-indigo-100"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.filesDetected.map((file, idx) => (
            <div key={idx} className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">
                {file.purpose}
              </span>
              <span className="font-medium text-slate-800 truncate" title={file.name}>
                {file.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Content Performance */}
      {data.contentPerformance && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <SectionHeader 
            icon={<TrendingUp className="text-blue-600" size={28} />} 
            title="Content Performance Insights" 
            colorClass="border-blue-100"
          />
          <MarkdownText content={data.contentPerformance} />
        </section>
      )}

      {/* 3. Retention */}
      {data.retention && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <SectionHeader 
            icon={<Users className="text-emerald-600" size={28} />} 
            title="Audience Retention & Drop-off" 
            colorClass="border-emerald-100"
          />
          <MarkdownText content={data.retention} />
        </section>
      )}

      {/* 4. Revenue */}
      {data.revenue && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <SectionHeader 
            icon={<DollarSign className="text-amber-600" size={28} />} 
            title="Revenue & ROI Analysis" 
            colorClass="border-amber-100"
          />
          <MarkdownText content={data.revenue} />
        </section>
      )}

      {/* 5. Thumbnails/CTR */}
      {data.thumbnails && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <SectionHeader 
            icon={<Image className="text-pink-600" size={28} />} 
            title="Thumbnail, CTR & A/B Tests" 
            colorClass="border-pink-100"
          />
          <MarkdownText content={data.thumbnails} />
        </section>
      )}

      {/* Charts Section */}
      {data.charts && data.charts.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <SectionHeader 
            icon={<TrendingUp className="text-slate-600" size={28} />} 
            title="Visual Data Trends" 
            colorClass="border-slate-100"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {data.charts.map((chart, idx) => (
              <div key={idx} className="flex flex-col">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">{chart.title}</h3>
                <div className="h-64 w-full bg-slate-50 rounded-lg p-2 border border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    {chart.type === 'bar' ? (
                      <BarChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey={chart.xAxisKey} tick={{fontSize: 12}} stroke="#94a3b8" />
                        <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        {chart.dataKeys.map((key, kIdx) => (
                          <Bar key={key} dataKey={key} fill={colors[kIdx % colors.length]} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    ) : (
                      <LineChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey={chart.xAxisKey} tick={{fontSize: 12}} stroke="#94a3b8" />
                        <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        {chart.dataKeys.map((key, kIdx) => (
                          <Line key={key} type="monotone" dataKey={key} stroke={colors[kIdx % colors.length]} strokeWidth={2} dot={{r: 4}} />
                        ))}
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Combined Strategic Insights */}
      <section className="bg-slate-900 text-white rounded-2xl shadow-lg p-8">
         <SectionHeader 
            icon={<Layers className="text-blue-400" size={28} />} 
            title="Combined Strategic Insights" 
            colorClass="border-slate-700"
          />
        <div className="text-slate-300">
           <MarkdownText content={data.combinedStrategicInsights} />
        </div>
      </section>

      {/* 7. Recommendations */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <SectionHeader 
          icon={<CheckCircle className="text-green-600" size={28} />} 
          title="Final Actionable Recommendations" 
          colorClass="border-green-100"
        />
        <div className="space-y-4">
          {data.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
              <div className={`
                flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mr-4 mt-1
                ${rec.impact === 'High' ? 'bg-red-100 text-red-700' : 
                  rec.impact === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                  'bg-blue-100 text-blue-700'}
              `}>
                {rec.impact} Impact
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">{rec.action}</h4>
                <p className="text-slate-600 text-sm">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default AnalysisReport;