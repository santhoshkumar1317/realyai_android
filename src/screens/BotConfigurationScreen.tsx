import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../utils/api';

interface BotConfig {
  id: string;
  botType: 'TELEGRAM' | 'WHATSAPP' | 'EMAIL';
  isActive: boolean;
  telegramBotToken?: string;
  telegramBotUsername?: string;
  telegramBotInstructions?: string;
  whatsappAccessToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappVerifyToken?: string;
  whatsappBusinessAccountId?: string;
  whatsappAppSecret?: string;
  emailProvider?: string;
  emailAddress?: string;
  emailPassword?: string;
  emailImapHost?: string;
  emailImapPort?: number;
  emailSmtpHost?: string;
  emailSmtpPort?: number;
  emailInstructions?: string;
  lastTested?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

const BotConfigCard = ({
  config,
  onUpdate,
  onTest,
  isDarkMode,
}: {
  config: BotConfig;
  onUpdate: (id: string, updates: any) => void;
  onTest: (id: string) => void;
  isDarkMode: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState(config);

  const handleSave = () => {
    onUpdate(config.id, formData);
  };

  const getBotTypeColor = (botType: string) => {
    switch (botType) {
      case 'TELEGRAM': return '#0088cc';
      case 'WHATSAPP': return '#25D366';
      case 'EMAIL': return '#ea4335';
      default: return '#666';
    }
  };

  const getBotTypeIcon = (botType: string) => {
    switch (botType) {
      case 'TELEGRAM': return '📱';
      case 'WHATSAPP': return '💬';
      case 'EMAIL': return '📧';
      default: return '🤖';
    }
  };

  return (
    <View style={[styles.configCard, isDarkMode ? null : styles.lightConfigCard]}>
      <TouchableOpacity
        style={[styles.configHeader, isDarkMode ? null : styles.lightConfigHeader]}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.configHeaderLeft}>
          <Text style={[styles.botIcon, isDarkMode ? null : styles.lightBotIcon]}>{getBotTypeIcon(config.botType)}</Text>
          <View>
            <Text style={[styles.botType, isDarkMode ? null : styles.lightBotType]}>{config.botType}</Text>
            <Text style={[styles.botStatus, isDarkMode ? null : styles.lightBotStatus]}>
              {config.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={styles.configHeaderRight}>
          <View style={[styles.statusIndicator, { backgroundColor: getBotTypeColor(config.botType) }]} />
          <Text style={[styles.expandIcon, isDarkMode ? null : styles.lightExpandIcon]}>{isExpanded ? '▼' : '▶'}</Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.configContent}>
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, isDarkMode ? null : styles.lightSwitchLabel]}>Active</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => setFormData({ ...formData, isActive: value })}
              trackColor={{ false: '#767577', true: getBotTypeColor(config.botType) }}
              thumbColor={formData.isActive ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          {config.botType === 'TELEGRAM' && (
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, isDarkMode ? null : styles.lightSectionTitle]}>Telegram Configuration</Text>
              <TextInput
                style={[styles.input, isDarkMode ? null : styles.lightInput]}
                placeholder="Bot Token"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.telegramBotToken || ''}
                onChangeText={(value) => setFormData({ ...formData, telegramBotToken: value })}
                secureTextEntry
              />
              <TextInput
                style={[styles.input, isDarkMode ? null : styles.lightInput]}
                placeholder="Bot Username"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.telegramBotUsername || ''}
                onChangeText={(value) => setFormData({ ...formData, telegramBotUsername: value })}
              />
              <TextInput
                style={[styles.input, styles.textArea, isDarkMode ? null : styles.lightInput]}
                placeholder="Bot Instructions"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.telegramBotInstructions || ''}
                onChangeText={(value) => setFormData({ ...formData, telegramBotInstructions: value })}
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          {config.botType === 'WHATSAPP' && (
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, isDarkMode ? null : styles.lightSectionTitle]}>WhatsApp Configuration</Text>
              <TextInput
                style={[styles.input, isDarkMode ? null : styles.lightInput]}
                placeholder="Access Token"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.whatsappAccessToken || ''}
                onChangeText={(value) => setFormData({ ...formData, whatsappAccessToken: value })}
                secureTextEntry
              />
              <TextInput
                style={[styles.input, isDarkMode ? null : styles.lightInput]}
                placeholder="Phone Number ID"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.whatsappPhoneNumberId || ''}
                onChangeText={(value) => setFormData({ ...formData, whatsappPhoneNumberId: value })}
              />
              <TextInput
                style={[styles.input, isDarkMode ? null : styles.lightInput]}
                placeholder="Verify Token"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.whatsappVerifyToken || ''}
                onChangeText={(value) => setFormData({ ...formData, whatsappVerifyToken: value })}
                secureTextEntry
              />
              <TextInput
                style={[styles.input, isDarkMode ? null : styles.lightInput]}
                placeholder="Business Account ID"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.whatsappBusinessAccountId || ''}
                onChangeText={(value) => setFormData({ ...formData, whatsappBusinessAccountId: value })}
              />
              <TextInput
                style={[styles.input, isDarkMode ? null : styles.lightInput]}
                placeholder="App Secret"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.whatsappAppSecret || ''}
                onChangeText={(value) => setFormData({ ...formData, whatsappAppSecret: value })}
                secureTextEntry
              />
            </View>
          )}

          {config.botType === 'EMAIL' && (
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, isDarkMode ? null : styles.lightSectionTitle]}>Email Configuration</Text>
              <TextInput
                style={[styles.input, isDarkMode ? null : styles.lightInput]}
                placeholder="Provider (Gmail, Outlook, etc.)"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.emailProvider || ''}
                onChangeText={(value) => setFormData({ ...formData, emailProvider: value })}
              />
              <TextInput
                style={[styles.input, isDarkMode ? null : styles.lightInput]}
                placeholder="Email Address"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.emailAddress || ''}
                onChangeText={(value) => setFormData({ ...formData, emailAddress: value })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, isDarkMode ? null : styles.lightInput]}
                placeholder="Password/App Password"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.emailPassword || ''}
                onChangeText={(value) => setFormData({ ...formData, emailPassword: value })}
                secureTextEntry
              />
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput, isDarkMode ? null : styles.lightInput]}
                  placeholder="IMAP Host"
                  placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                  value={formData.emailImapHost || ''}
                  onChangeText={(value) => setFormData({ ...formData, emailImapHost: value })}
                />
                <TextInput
                  style={[styles.input, styles.halfInput, isDarkMode ? null : styles.lightInput]}
                  placeholder="IMAP Port"
                  placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                  value={formData.emailImapPort?.toString() || ''}
                  onChangeText={(value) => setFormData({ ...formData, emailImapPort: parseInt(value) || undefined })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput, isDarkMode ? null : styles.lightInput]}
                  placeholder="SMTP Host"
                  placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                  value={formData.emailSmtpHost || ''}
                  onChangeText={(value) => setFormData({ ...formData, emailSmtpHost: value })}
                />
                <TextInput
                  style={[styles.input, styles.halfInput, isDarkMode ? null : styles.lightInput]}
                  placeholder="SMTP Port"
                  placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                  value={formData.emailSmtpPort?.toString() || ''}
                  onChangeText={(value) => setFormData({ ...formData, emailSmtpPort: parseInt(value) || undefined })}
                  keyboardType="numeric"
                />
              </View>
              <TextInput
                style={[styles.input, styles.textArea, isDarkMode ? null : styles.lightInput]}
                placeholder="Email Instructions"
                placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
                value={formData.emailInstructions || ''}
                onChangeText={(value) => setFormData({ ...formData, emailInstructions: value })}
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.testButton, isDarkMode ? null : styles.lightTestButton]} onPress={() => onTest(config.id)}>
              <Text style={[styles.testButtonText, isDarkMode ? null : styles.lightTestButtonText]}>Test</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, isDarkMode ? null : styles.lightSaveButton]} onPress={handleSave}>
              <Text style={[styles.saveButtonText, isDarkMode ? null : styles.lightSaveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>

          {config.lastTested && (
            <View style={[styles.testInfo, isDarkMode ? null : styles.lightTestInfo]}>
              <Text style={[styles.testInfoText, isDarkMode ? null : styles.lightTestInfoText]}>
                Last tested: {new Date(config.lastTested).toLocaleString()}
              </Text>
              {config.lastError && (
                <Text style={[styles.errorText, isDarkMode ? null : styles.lightErrorText]}>{config.lastError}</Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const BotConfigurationScreen = () => {
  const { isDarkMode } = useTheme();
  const [configs, setConfigs] = useState<BotConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBotConfigs();
  }, []);

  const loadBotConfigs = async () => {
    try {
      const response = await apiService.getBotConfigs();
      setConfigs(response.botConfigs);
    } catch (error) {
      console.error('Error loading bot configs:', error);
      Alert.alert('Error', 'Failed to load bot configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (id: string, updates: any) => {
    try {
      await apiService.updateBotConfig(id, updates);
      Alert.alert('Success', 'Bot configuration updated successfully');
      loadBotConfigs(); // Reload configs
    } catch (error) {
      console.error('Error updating bot config:', error);
      Alert.alert('Error', 'Failed to update bot configuration');
    }
  };

  const handleTestConfig = async (id: string) => {
    try {
      await apiService.getBotConfigById(id); // This will trigger the test endpoint
      Alert.alert('Success', 'Bot configuration tested successfully');
      loadBotConfigs(); // Reload configs to get updated test status
    } catch (error) {
      console.error('Error testing bot config:', error);
      Alert.alert('Error', 'Bot configuration test failed');
    }
  };

  const handleCreateConfig = async (botType: 'TELEGRAM' | 'WHATSAPP' | 'EMAIL') => {
    try {
      await apiService.createBotConfig({ botType });
      Alert.alert('Success', `${botType} bot configuration created successfully`);
      loadBotConfigs(); // Reload configs
    } catch (error) {
      console.error('Error creating bot config:', error);
      Alert.alert('Error', `Failed to create ${botType} bot configuration`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading bot configurations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>Bot Configuration</Text>
        <Text style={[styles.subtitle, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>Configure your Telegram, WhatsApp, and Email bots</Text>
      </View>

      {configs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isDarkMode ? null : styles.lightEmptyText]}>No bot configurations found</Text>
          <Text style={[styles.emptySubtext, isDarkMode ? null : styles.lightEmptySubtext]}>Create your first bot configuration below</Text>
        </View>
      ) : (
        <View style={styles.configsContainer}>
          {configs.map((config) => (
            <BotConfigCard
              key={config.id}
              config={config}
              onUpdate={handleUpdateConfig}
              onTest={handleTestConfig}
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      )}

      <View style={[styles.createContainer, isDarkMode ? null : styles.lightCreateContainer]}>
        <Text style={[styles.createTitle, isDarkMode ? null : styles.lightCreateTitle]}>Create New Bot Configuration</Text>
        <View style={styles.createButtons}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#0088cc' }]}
            onPress={() => handleCreateConfig('TELEGRAM')}
          >
            <Text style={[styles.createButtonText, isDarkMode ? null : styles.lightCreateButtonText]}>Telegram</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#25D366' }]}
            onPress={() => handleCreateConfig('WHATSAPP')}
          >
            <Text style={[styles.createButtonText, isDarkMode ? null : styles.lightCreateButtonText]}>WhatsApp </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#ea4335' }]}
            onPress={() => handleCreateConfig('EMAIL')}
          >
            <Text style={[styles.createButtonText, isDarkMode ? null : styles.lightCreateButtonText]}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F71',
    paddingTop: 20, // Add padding to prevent content from hiding behind status bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1F71',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#1A1F71',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'System',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0C4E4',
    textAlign: 'center',
    fontFamily: 'System',
  },
  configsContainer: {
    padding: 16,
  },
  configCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  configHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  botType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  botStatus: {
    fontSize: 14,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  configHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  expandIcon: {
    fontSize: 16,
    color: '#A0C4E4',
  },
  configContent: {
    padding: 16,
    paddingTop: 0,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'System',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'System',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  buttonContainer: {
    flexDirection: 'column',
    marginTop: 16,
  },
  testButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'System',
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'System',
  },
  testInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  testInfoText: {
    fontSize: 12,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontFamily: 'System',
  },
  createContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    margin: 16,
    borderRadius: 16,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'System',
  },
  createButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'System',
  },
  darkContainer: {
    backgroundColor: '#1A1F71',
  },
  lightContainer: {
    backgroundColor: '#E0F7FA',
  },
  darkHeader: {
    backgroundColor: '#1A1F71',
  },
  lightHeader: {
    backgroundColor: '#E0F7FA',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#1A1F71',
  },
  darkSubtitle: {
    color: '#A0C4E4',
  },
  lightSubtitle: {
    color: '#666666',
  },
  lightConfigCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  lightConfigHeader: {
    backgroundColor: '#FFFFFF',
  },
  lightBotIcon: {
    color: '#1A1F71',
  },
  lightBotType: {
    color: '#1A1F71',
  },
  lightBotStatus: {
    color: '#666666',
  },
  lightExpandIcon: {
    color: '#666666',
  },
  lightSwitchLabel: {
    color: '#1A1F71',
  },
  lightSectionTitle: {
    color: '#1A1F71',
  },
  lightInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0, 0, 0, 0.2)',
    color: '#1A1F71',
  },
  lightTestButton: {
    backgroundColor: '#f59e0b',
  },
  lightTestButtonText: {
    color: '#FFFFFF',
  },
  lightSaveButton: {
    backgroundColor: '#10b981',
  },
  lightSaveButtonText: {
    color: '#FFFFFF',
  },
  lightTestInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  lightTestInfoText: {
    color: '#666666',
  },
  lightErrorText: {
    color: '#ef4444',
  },
  lightEmptyText: {
    color: '#1A1F71',
  },
  lightEmptySubtext: {
    color: '#666666',
  },
  lightCreateContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  lightCreateTitle: {
    color: '#1A1F71',
  },
  lightCreateButtonText: {
    color: '#FFFFFF',
  },
});

export default BotConfigurationScreen;