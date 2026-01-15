'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import {
  ArrowLeft,
  Monitor,
  Video,
  Settings,
  Package,
  Play,
  MessageCircle,
  Square,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  Download,
  Copy,
  Wifi,
  Camera,
  Mic,
  Sun,
  ExternalLink
} from 'lucide-react'

export default function LiveStreamingGuidePage() {
  const t = useTranslations('liveGuide')
  const [activeSection, setActiveSection] = useState<string>('requirements')

  const sections = [
    { id: 'requirements', icon: CheckCircle, label: t('sections.requirements') },
    { id: 'create', icon: Video, label: t('sections.create') },
    { id: 'obs', icon: Monitor, label: t('sections.obs') },
    { id: 'products', icon: Package, label: t('sections.products') },
    { id: 'start', icon: Play, label: t('sections.start') },
    { id: 'during', icon: MessageCircle, label: t('sections.during') },
    { id: 'end', icon: Square, label: t('sections.end') },
    { id: 'tips', icon: Lightbulb, label: t('sections.tips') },
    { id: 'troubleshooting', icon: AlertTriangle, label: t('sections.troubleshooting') },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/live"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToLive')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <nav className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow sticky top-4">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{t('tableOfContents')}</h3>
              </div>
              <ul className="p-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <section.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{section.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow">
              {/* Requirements Section */}
              {activeSection === 'requirements' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('requirements.title')}</h2>
                  </div>

                  <p className="text-gray-600 mb-6">{t('requirements.intro')}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Equipment */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">{t('requirements.equipment.title')}</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start space-x-3">
                          <Monitor className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{t('requirements.equipment.computer')}</p>
                            <p className="text-sm text-gray-500">{t('requirements.equipment.computerDesc')}</p>
                          </div>
                        </li>
                        <li className="flex items-start space-x-3">
                          <Camera className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{t('requirements.equipment.camera')}</p>
                            <p className="text-sm text-gray-500">{t('requirements.equipment.cameraDesc')}</p>
                          </div>
                        </li>
                        <li className="flex items-start space-x-3">
                          <Mic className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{t('requirements.equipment.microphone')}</p>
                            <p className="text-sm text-gray-500">{t('requirements.equipment.microphoneDesc')}</p>
                          </div>
                        </li>
                        <li className="flex items-start space-x-3">
                          <Sun className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{t('requirements.equipment.lighting')}</p>
                            <p className="text-sm text-gray-500">{t('requirements.equipment.lightingDesc')}</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    {/* Software */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">{t('requirements.software.title')}</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start space-x-3">
                          <Download className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{t('requirements.software.obs')}</p>
                            <p className="text-sm text-gray-500">{t('requirements.software.obsDesc')}</p>
                          </div>
                        </li>
                        <li className="flex items-start space-x-3">
                          <Wifi className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{t('requirements.software.browser')}</p>
                            <p className="text-sm text-gray-500">{t('requirements.software.browserDesc')}</p>
                          </div>
                        </li>
                      </ul>

                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">{t('requirements.gshop.title')}</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• {t('requirements.gshop.product')}</li>
                          <li>• {t('requirements.gshop.verified')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Stream Section */}
              {activeSection === 'create' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Video className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('create.title')}</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('create.step1.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>{t('create.step1.item1')}</li>
                        <li>{t('create.step1.item2')}</li>
                        <li>{t('create.step1.item3')}</li>
                      </ol>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('create.step2.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>{t('create.step2.item1')}</li>
                        <li>{t('create.step2.item2')}</li>
                      </ol>

                      <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 font-medium text-gray-900">{t('create.table.field')}</th>
                              <th className="text-left py-2 font-medium text-gray-900">{t('create.table.description')}</th>
                              <th className="text-left py-2 font-medium text-gray-900">{t('create.table.example')}</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-600">
                            <tr className="border-b border-gray-100">
                              <td className="py-2 font-medium">{t('create.table.titleField')}</td>
                              <td className="py-2">{t('create.table.titleDesc')}</td>
                              <td className="py-2 text-gray-500">{t('create.table.titleExample')}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 font-medium">{t('create.table.descField')}</td>
                              <td className="py-2">{t('create.table.descDesc')}</td>
                              <td className="py-2 text-gray-500">{t('create.table.descExample')}</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-medium">{t('create.table.scheduleField')}</td>
                              <td className="py-2">{t('create.table.scheduleDesc')}</td>
                              <td className="py-2 text-gray-500">{t('create.table.scheduleExample')}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <ol className="list-decimal list-inside space-y-2 text-gray-600 mt-4" start={3}>
                        <li>{t('create.step2.item3')}</li>
                        <li>{t('create.step2.item4')}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* OBS Configuration Section */}
              {activeSection === 'obs' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Monitor className="h-6 w-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('obs.title')}</h2>
                  </div>

                  <p className="text-gray-600 mb-6">{t('obs.intro')}</p>

                  <div className="space-y-6">
                    {/* Step 1: Download */}
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('obs.step1.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-3">
                        <li>{t('obs.step1.item1')}</li>
                        <li>{t('obs.step1.item2')}</li>
                        <li>{t('obs.step1.item3')}</li>
                        <li>{t('obs.step1.item4')}</li>
                      </ol>
                      <a
                        href="https://obsproject.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        <span>{t('obs.downloadBtn')}</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    {/* Step 2: Get Stream Data */}
                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('obs.step2.title')}</h3>
                      <p className="text-gray-600 mb-3">{t('obs.step2.intro')}</p>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-3">
                        <li>{t('obs.step2.item1')}</li>
                        <li>{t('obs.step2.item2')}</li>
                        <li>{t('obs.step2.item3')}</li>
                        <li>{t('obs.step2.item4')}</li>
                      </ol>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-700">
                            <strong>{t('obs.step2.warning')}</strong> {t('obs.step2.warningDesc')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Configure OBS */}
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('obs.step3.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-3">
                        <li>{t('obs.step3.item1')}</li>
                        <li>{t('obs.step3.item2')}</li>
                        <li>{t('obs.step3.item3')}</li>
                        <li>{t('obs.step3.item4')}</li>
                      </ol>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 font-medium text-gray-900">{t('obs.table.field')}</th>
                              <th className="text-left py-2 font-medium text-gray-900">{t('obs.table.value')}</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-600">
                            <tr className="border-b border-gray-100">
                              <td className="py-2 font-medium">{t('obs.table.service')}</td>
                              <td className="py-2"><code className="bg-gray-200 px-2 py-0.5 rounded">{t('obs.table.serviceValue')}</code></td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 font-medium">{t('obs.table.server')}</td>
                              <td className="py-2">{t('obs.table.serverValue')}</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-medium">{t('obs.table.streamKey')}</td>
                              <td className="py-2">{t('obs.table.streamKeyValue')}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Step 4: Video Quality */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('obs.step4.title')}</h3>
                      <p className="text-gray-600 mb-3">{t('obs.step4.intro')}</p>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">{t('obs.step4.output')}</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li><strong>{t('obs.step4.bitrate')}:</strong> 2500 - 4500 kbps</li>
                            <li><strong>{t('obs.step4.encoder')}:</strong> x264 o Hardware</li>
                            <li><strong>{t('obs.step4.keyframe')}:</strong> 2</li>
                          </ul>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">{t('obs.step4.video')}</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li><strong>{t('obs.step4.resolution')}:</strong> 1280x720 o 1920x1080</li>
                            <li><strong>FPS:</strong> 30</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Step 5: Add Sources */}
                    <div className="border-l-4 border-red-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('obs.step5.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>{t('obs.step5.item1')}</li>
                        <li>{t('obs.step5.item2')}</li>
                        <li>{t('obs.step5.item3')}</li>
                        <li>{t('obs.step5.item4')}</li>
                        <li>{t('obs.step5.item5')}</li>
                        <li>{t('obs.step5.item6')}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Section */}
              {activeSection === 'products' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Package className="h-6 w-6 text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('products.title')}</h2>
                  </div>

                  <p className="text-gray-600 mb-6">{t('products.intro')}</p>

                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('products.add.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>{t('products.add.item1')}</li>
                        <li>{t('products.add.item2')}</li>
                        <li>{t('products.add.item3')}</li>
                        <li>{t('products.add.item4')}</li>
                        <li>{t('products.add.item5')}</li>
                      </ol>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('products.highlight.title')}</h3>
                      <p className="text-gray-600 mb-3">{t('products.highlight.intro')}</p>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>{t('products.highlight.item1')}</li>
                        <li>{t('products.highlight.item2')}</li>
                        <li>{t('products.highlight.item3')}</li>
                        <li>{t('products.highlight.item4')}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Start Streaming Section */}
              {activeSection === 'start' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Play className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('start.title')}</h2>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-yellow-800 font-medium">{t('start.important')}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('start.step1.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>{t('start.step1.item1')}</li>
                        <li>{t('start.step1.item2')}</li>
                        <li>{t('start.step1.item3')}</li>
                      </ol>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('start.step2.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>{t('start.step2.item1')}</li>
                        <li>{t('start.step2.item2')}</li>
                        <li>{t('start.step2.item3')}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* During Stream Section */}
              {activeSection === 'during' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MessageCircle className="h-6 w-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('during.title')}</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('during.panel.title')}</h3>
                      <p className="text-gray-600 mb-3">{t('during.panel.intro')}</p>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-center space-x-2">
                          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                          <span><strong>{t('during.panel.viewers')}:</strong> {t('during.panel.viewersDesc')}</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                          <span><strong>{t('during.panel.peak')}:</strong> {t('during.panel.peakDesc')}</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                          <span><strong>{t('during.panel.sales')}:</strong> {t('during.panel.salesDesc')}</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                          <span><strong>{t('during.panel.chat')}:</strong> {t('during.panel.chatDesc')}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-red-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('during.moderation.title')}</h3>
                      <p className="text-gray-600 mb-3">{t('during.moderation.intro')}</p>
                      <ul className="space-y-2 text-gray-600">
                        <li><strong>{t('during.moderation.delete')}:</strong> {t('during.moderation.deleteDesc')}</li>
                        <li><strong>{t('during.moderation.timeout')}:</strong> {t('during.moderation.timeoutDesc')}</li>
                        <li><strong>{t('during.moderation.ban')}:</strong> {t('during.moderation.banDesc')}</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('during.highlight.title')}</h3>
                      <p className="text-gray-600 mb-3">{t('during.highlight.intro')}</p>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>{t('during.highlight.item1')}</li>
                        <li>{t('during.highlight.item2')}</li>
                        <li>{t('during.highlight.item3')}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* End Stream Section */}
              {activeSection === 'end' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Square className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('end.title')}</h2>
                  </div>

                  <p className="text-gray-600 mb-6">{t('end.intro')}</p>

                  <div className="space-y-6">
                    <div className="border-l-4 border-red-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('end.step1.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>{t('end.step1.item1')}</li>
                        <li>{t('end.step1.item2')}</li>
                      </ol>
                    </div>

                    <div className="border-l-4 border-gray-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('end.step2.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>{t('end.step2.item1')}</li>
                        <li>{t('end.step2.item2')}</li>
                      </ol>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{t('end.results.title')}</h3>
                      <p className="text-gray-600 mb-3">{t('end.results.intro')}</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>{t('end.results.item1')}</li>
                        <li>{t('end.results.item2')}</li>
                        <li>{t('end.results.item3')}</li>
                        <li>{t('end.results.item4')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Tips Section */}
              {activeSection === 'tips' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Lightbulb className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('tips.title')}</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-3">{t('tips.before.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-blue-800">
                        <li>{t('tips.before.item1')}</li>
                        <li>{t('tips.before.item2')}</li>
                        <li>{t('tips.before.item3')}</li>
                        <li>{t('tips.before.item4')}</li>
                      </ol>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 mb-3">{t('tips.during.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-green-800">
                        <li>{t('tips.during.item1')}</li>
                        <li>{t('tips.during.item2')}</li>
                        <li>{t('tips.during.item3')}</li>
                        <li>{t('tips.during.item4')}</li>
                        <li>{t('tips.during.item5')}</li>
                        <li>{t('tips.during.item6')}</li>
                      </ol>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-900 mb-3">{t('tips.after.title')}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-purple-800">
                        <li>{t('tips.after.item1')}</li>
                        <li>{t('tips.after.item2')}</li>
                        <li>{t('tips.after.item3')}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Troubleshooting Section */}
              {activeSection === 'troubleshooting' && (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('troubleshooting.title')}</h2>
                  </div>

                  <div className="space-y-4">
                    <details className="border border-gray-200 rounded-lg">
                      <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                        {t('troubleshooting.noVideo.title')}
                      </summary>
                      <div className="px-4 pb-4 text-gray-600">
                        <ul className="list-disc list-inside space-y-1">
                          <li>{t('troubleshooting.noVideo.item1')}</li>
                          <li>{t('troubleshooting.noVideo.item2')}</li>
                          <li>{t('troubleshooting.noVideo.item3')}</li>
                        </ul>
                      </div>
                    </details>

                    <details className="border border-gray-200 rounded-lg">
                      <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                        {t('troubleshooting.noConnect.title')}
                      </summary>
                      <div className="px-4 pb-4 text-gray-600">
                        <ul className="list-disc list-inside space-y-1">
                          <li>{t('troubleshooting.noConnect.item1')}</li>
                          <li>{t('troubleshooting.noConnect.item2')}</li>
                          <li>{t('troubleshooting.noConnect.item3')}</li>
                        </ul>
                      </div>
                    </details>

                    <details className="border border-gray-200 rounded-lg">
                      <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                        {t('troubleshooting.lag.title')}
                      </summary>
                      <div className="px-4 pb-4 text-gray-600">
                        <ul className="list-disc list-inside space-y-1">
                          <li>{t('troubleshooting.lag.item1')}</li>
                          <li>{t('troubleshooting.lag.item2')}</li>
                          <li>{t('troubleshooting.lag.item3')}</li>
                        </ul>
                      </div>
                    </details>

                    <details className="border border-gray-200 rounded-lg">
                      <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                        {t('troubleshooting.noSound.title')}
                      </summary>
                      <div className="px-4 pb-4 text-gray-600">
                        <ul className="list-disc list-inside space-y-1">
                          <li>{t('troubleshooting.noSound.item1')}</li>
                          <li>{t('troubleshooting.noSound.item2')}</li>
                          <li>{t('troubleshooting.noSound.item3')}</li>
                        </ul>
                      </div>
                    </details>

                    <details className="border border-gray-200 rounded-lg">
                      <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                        {t('troubleshooting.cantStart.title')}
                      </summary>
                      <div className="px-4 pb-4 text-gray-600">
                        <ul className="list-disc list-inside space-y-1">
                          <li>{t('troubleshooting.cantStart.item1')}</li>
                          <li>{t('troubleshooting.cantStart.item2')}</li>
                          <li>{t('troubleshooting.cantStart.item3')}</li>
                        </ul>
                      </div>
                    </details>
                  </div>

                  <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900">{t('troubleshooting.needHelp.title')}</h4>
                        <p className="text-sm text-blue-700 mt-1">{t('troubleshooting.needHelp.desc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  )
}
