import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, Upload, Image as ImageIcon, Percent, Info } from 'lucide-react';
import { Button } from '../common/Button';
import type { ParsedQuestion, ArchetypeName } from '../../types';
import { ARCHETYPES } from '../../types';
import { ARCHETYPE_DATA } from '../../data/archetypes';
import { getImageUrl } from '../../data/imageAssets';

interface QuestionEditorModalProps {
  isOpen: boolean;
  question?: ParsedQuestion | null;
  onSave: (question: ParsedQuestion) => void;
  onCancel: () => void;
}

const QUESTION_FORMATS = [
  'Forced Choice',
  'Slider', 
  'Image Choice',
  'Word Choice',
  'Word Choice (Multi)',
  'Ranking',
  'Story Completion',
  'Scenario Decision'
] as const;

const CATEGORIES = ['Broad', 'Clarifier', 'Validator'] as const;

interface ArchetypeWeight {
  archetype: ArchetypeName;
  weight: number;
}

interface OptionMapping {
  option: string;
  weights: ArchetypeWeight[];
}

export function QuestionEditorModal({ isOpen, question, onSave, onCancel }: QuestionEditorModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    question: '',
    format: 'Forced Choice' as any,
    category: 'Broad' as any,
    overlapGroup: '',
    notes: '',
    maxSelections: 2,
    status: 'active' as 'active' | 'archived'
  });

  const [options, setOptions] = useState<string[]>(['']);
  const [optionMappings, setOptionMappings] = useState<OptionMapping[]>([]);
  const [selectedArchetypes, setSelectedArchetypes] = useState<ArchetypeName[]>([]);
  const [imageAssets, setImageAssets] = useState<Array<{key: string, url: string, file?: File}>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'options' | 'mapping'>('basic');

  const isEditing = !!question;

  useEffect(() => {
    if (question) {
      setFormData({
        id: question.id,
        question: question.question,
        format: question.format,
        category: question.category,
        overlapGroup: question.overlapGroup || '',
        notes: question.notes || '',
        maxSelections: question.maxSelections || 2,
        status: question.status || 'active'
      });

      // Parse existing options and mappings
      if (question.format === 'Slider') {
        setOptions(['1', '2', '3', '4', '5', '6', '7']);
      } else {
        setOptions(question.parsedOptions || ['']);
      }

      // Convert existing mappings
      const mappings: OptionMapping[] = [];
      Object.entries(question.parsedMapping || {}).forEach(([option, weights]) => {
        mappings.push({
          option,
          weights: weights.map(w => ({ archetype: w.archetype, weight: w.weight }))
        });
      });
      setOptionMappings(mappings);

      // Extract selected archetypes for Clarifier/Validator
      if (question.category === 'Clarifier' || question.category === 'Validator') {
        const archetypes = new Set<ArchetypeName>();
        Object.values(question.parsedMapping || {}).forEach(weights => {
          weights.forEach(w => archetypes.add(w.archetype));
        });
        setSelectedArchetypes(Array.from(archetypes));
      }

      // Parse image assets if present
      if (question.assetKeys && question.format === 'Image Choice') {
        const keys = question.assetKeys.replace('img:', '').split(',');
        setImageAssets(keys.map(key => ({ key: key.trim(), url: getImageUrl(key.trim()) })));
      }
    } else {
      // Reset for new question
      setFormData({
        id: '',
        question: '',
        format: 'Forced Choice',
        category: 'Broad',
        overlapGroup: '',
        notes: '',
        maxSelections: 2,
        status: 'active'
      });
      setOptions(['']);
      setOptionMappings([]);
      setSelectedArchetypes([]);
      setImageAssets([]);
    }
    setErrors({});
    setActiveTab('basic');
  }, [question, isOpen]);

  // Update options when format changes
  useEffect(() => {
    if (formData.format === 'Slider') {
      setOptions(['1', '2', '3', '4', '5', '6', '7']);
    } else if (options.length === 7 && options[0] === '1') {
      // Reset from slider format
      setOptions(['']);
    }
  }, [formData.format]);

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      // Remove corresponding mappings
      setOptionMappings(prev => prev.filter(m => m.option !== options[index]));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    const oldValue = newOptions[index];
    newOptions[index] = value;
    setOptions(newOptions);

    // Update corresponding mapping
    setOptionMappings(prev => prev.map(m => 
      m.option === oldValue ? { ...m, option: value } : m
    ));
  };

  const addImageAsset = () => {
    setImageAssets([...imageAssets, { key: '', url: '' }]);
  };

  const removeImageAsset = (index: number) => {
    setImageAssets(prev => prev.filter((_, i) => i !== index));
  };

  const updateImageAsset = (index: number, key: string, file?: File) => {
    setImageAssets(prev => prev.map((asset, i) => 
      i === index ? { ...asset, key, file, url: file ? URL.createObjectURL(file) : asset.url } : asset
    ));
  };

  const replaceImageAsset = (index: number, file: File) => {
    setImageAssets(prev => prev.map((asset, i) => 
      i === index ? { 
        ...asset, 
        file, 
        url: URL.createObjectURL(file),
        key: asset.key || file.name.split('.')[0]
      } : asset
    ));
  };

  const handleArchetypeToggle = (archetype: ArchetypeName) => {
    setSelectedArchetypes(prev => 
      prev.includes(archetype) 
        ? prev.filter(a => a !== archetype)
        : [...prev, archetype]
    );
  };

  const updateOptionMapping = (option: string, archetype: ArchetypeName, weight: number) => {
    setOptionMappings(prev => {
      const existing = prev.find(m => m.option === option);
      if (existing) {
        const updatedWeights = existing.weights.filter(w => w.archetype !== archetype);
        if (weight > 0) {
          updatedWeights.push({ archetype, weight });
        }
        return prev.map(m => 
          m.option === option 
            ? { ...m, weights: updatedWeights }
            : m
        );
      } else if (weight > 0) {
        return [...prev, { option, weights: [{ archetype, weight }] }];
      }
      return prev;
    });
  };

  const getOptionWeight = (option: string, archetype: ArchetypeName): number => {
    const mapping = optionMappings.find(m => m.option === option);
    const weight = mapping?.weights.find(w => w.archetype === archetype);
    return weight?.weight || 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id.trim()) {
      newErrors.id = 'Question ID is required';
    }

    if (!formData.question.trim()) {
      newErrors.question = 'Question text is required';
    }

    if (options.some(opt => !opt.trim()) && formData.format !== 'Slider') {
      newErrors.options = 'All options must have text';
    }

    if (formData.format === 'Image Choice' && imageAssets.length === 0) {
      newErrors.images = 'At least one image is required for Image Choice questions';
    }

    // Validate mappings
    const hasValidMappings = options.some(option => {
      const mapping = optionMappings.find(m => m.option === option);
      return mapping && mapping.weights.length > 0;
    });

    if (!hasValidMappings && formData.format !== 'Slider') {
      newErrors.mapping = 'At least one option must have archetype mappings';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert form data back to ParsedQuestion
      const parsedOptions = formData.format === 'Slider' 
        ? ['1', '2', '3', '4', '5', '6', '7']
        : options.filter(opt => opt.trim());

      const parsedMapping: Record<string, any[]> = {};
      
      if (formData.format === 'Slider') {
        // For slider, apply weights to all values
        selectedArchetypes.forEach(archetype => {
          for (let i = 1; i <= 7; i++) {
            if (!parsedMapping[i.toString()]) {
              parsedMapping[i.toString()] = [];
            }
            parsedMapping[i.toString()].push({ archetype, weight: 1 });
          }
        });
      } else {
        optionMappings.forEach(mapping => {
          if (mapping.weights.length > 0) {
            parsedMapping[mapping.option] = mapping.weights;
          }
        });
      }

      const updatedQuestion: ParsedQuestion = {
        id: formData.id,
        question: formData.question,
        format: formData.format,
        parsedOptions,
        parsedMapping,
        category: formData.category,
        overlapGroup: formData.overlapGroup || undefined,
        assetKeys: formData.format === 'Image Choice' && imageAssets.length > 0 
          ? `img:${imageAssets.map(a => a.key).join(',')}`
          : undefined,
        notes: formData.notes || undefined,
        required: true,
        maxSelections: formData.format === 'Word Choice (Multi)' ? formData.maxSelections : undefined,
        status: formData.status,
        usedInSessions: question?.usedInSessions || false
      };

      await new Promise(resolve => setTimeout(resolve, 500));
      onSave(updatedQuestion);
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question ID *
          </label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.id ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="B01, C01, V01, etc."
            disabled={isEditing}
          />
          {errors.id && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.id}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Text *
        </label>
        <textarea
          value={formData.question}
          onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.question ? 'border-red-300' : 'border-gray-300'
          }`}
          rows={3}
          placeholder="Enter the question text..."
        />
        {errors.question && (
          <p className="text-sm text-red-600 mt-1 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.question}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Format *
          </label>
          <select
            value={formData.format}
            onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {QUESTION_FORMATS.map(format => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={question?.usedInSessions}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {formData.format === 'Word Choice (Multi)' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Selections
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.maxSelections}
            onChange={(e) => setFormData(prev => ({ ...prev, maxSelections: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );

  const renderOptionsTab = () => (
    <div className="space-y-6">
      {formData.format === 'Slider' ? (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            <Info className="w-4 h-4 inline mr-1" />
            Slider questions automatically use a 1-7 scale. Configure archetype mappings in the next tab.
          </p>
          <div className="flex justify-between text-xs text-blue-600">
            <span>Strongly Disagree</span>
            <span>Neutral</span>
            <span>Strongly Agree</span>
          </div>
        </div>
      ) : formData.format === 'Image Choice' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Image Assets</h3>
            <Button onClick={addImageAsset} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
          </div>
          
          {errors.images && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.images}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imageAssets.map((asset, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">Image {index + 1}</h4>
                  <button
                    onClick={() => removeImageAsset(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Current Image Display */}
                {asset.url && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Image
                    </label>
                    <div className="relative group">
                      <img 
                        src={asset.url} 
                        alt={asset.key || `Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-white rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-lg hover:bg-gray-50">
                            Replace Image
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                replaceImageAsset(index, file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Key
                    </label>
                    <input
                      type="text"
                      value={asset.key}
                      onChange={(e) => updateImageAsset(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., crown, compass, flame"
                    />
                  </div>
                  
                  {!asset.url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Image
                      </label>
                      <div className="flex items-center space-x-2">
                        <label className="cursor-pointer flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                updateImageAsset(index, asset.key || file.name.split('.')[0], file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Answer Options</h3>
            <Button onClick={addOption} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>
          
          {errors.options && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.options}
            </p>
          )}

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Option ${index + 1}`}
                  />
                </div>
                {options.length > 1 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {formData.format === 'Ranking' && (
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-amber-800">
                <Info className="w-4 h-4 inline mr-1" />
                For ranking questions, users will drag these options to order them by preference.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderMappingTab = () => (
    <div className="space-y-6">
      {(formData.category === 'Clarifier' || formData.category === 'Validator') ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              {formData.category === 'Clarifier' ? 'Archetype Clarification' : 'Archetype Validation'}
            </h3>
            <p className="text-sm text-blue-800">
              Select which archetypes this question {formData.category === 'Clarifier' ? 'clarifies' : 'validates'}:
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ARCHETYPES.map(archetype => (
              <label
                key={archetype}
                className={`
                  flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedArchetypes.includes(archetype)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={selectedArchetypes.includes(archetype)}
                  onChange={() => handleArchetypeToggle(archetype)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">{archetype}</div>
                  <div className="text-xs text-gray-500">{ARCHETYPE_DATA[archetype].traits[0]}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2 flex items-center">
              <Percent className="w-4 h-4 mr-2" />
              Percentage-Based Archetype Mapping
            </h3>
            <p className="text-sm text-green-800">
              Assign percentage weights to archetypes for each answer option. Weights don't need to total 100%.
            </p>
          </div>

          {errors.mapping && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.mapping}
            </p>
          )}

          <div className="space-y-6">
            {(formData.format === 'Slider' ? ['Slider Response'] : options.filter(opt => opt.trim())).map((option, optionIndex) => (
              <div key={optionIndex} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">
                  {formData.format === 'Slider' ? 'All Slider Values (1-7)' : `"${option}"`}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ARCHETYPES.map(archetype => {
                    const weight = formData.format === 'Slider' 
                      ? (selectedArchetypes.includes(archetype) ? 100 : 0)
                      : getOptionWeight(option, archetype);
                    
                    return (
                      <div key={archetype} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            {archetype}
                          </label>
                          <span className="text-sm text-gray-500">{weight}%</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={weight}
                            onChange={(e) => {
                              const newWeight = parseInt(e.target.value);
                              if (formData.format === 'Slider') {
                                if (newWeight > 0 && !selectedArchetypes.includes(archetype)) {
                                  setSelectedArchetypes(prev => [...prev, archetype]);
                                } else if (newWeight === 0 && selectedArchetypes.includes(archetype)) {
                                  setSelectedArchetypes(prev => prev.filter(a => a !== archetype));
                                }
                              } else {
                                updateOptionMapping(option, archetype, newWeight);
                              }
                            }}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, ${ARCHETYPE_DATA[archetype].color} 0%, ${ARCHETYPE_DATA[archetype].color} ${weight}%, #e5e7eb ${weight}%, #e5e7eb 100%)`
                            }}
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="5"
                            value={weight}
                            onChange={(e) => {
                              const newWeight = parseInt(e.target.value) || 0;
                              if (formData.format === 'Slider') {
                                if (newWeight > 0 && !selectedArchetypes.includes(archetype)) {
                                  setSelectedArchetypes(prev => [...prev, archetype]);
                                } else if (newWeight === 0 && selectedArchetypes.includes(archetype)) {
                                  setSelectedArchetypes(prev => prev.filter(a => a !== archetype));
                                }
                              } else {
                                updateOptionMapping(option, archetype, newWeight);
                              }
                            }}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'basic', label: 'Basic Info', icon: Info },
              { id: 'options', label: formData.format === 'Image Choice' ? 'Images' : 'Options', icon: formData.format === 'Image Choice' ? ImageIcon : Plus },
              { id: 'mapping', label: 'Archetype Mapping', icon: Percent }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'basic' && renderBasicTab()}
            {activeTab === 'options' && renderOptionsTab()}
            {activeTab === 'mapping' && renderMappingTab()}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-2">
              {activeTab !== 'basic' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ['basic', 'options', 'mapping'];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1] as any);
                    }
                  }}
                >
                  Previous
                </Button>
              )}
              {activeTab !== 'mapping' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ['basic', 'options', 'mapping'];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1] as any);
                    }
                  }}
                >
                  Next
                </Button>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Update Question' : 'Add Question'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}