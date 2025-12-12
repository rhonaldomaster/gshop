import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface FAQItemProps {
  faq: FAQ;
  isExpanded: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ faq, isExpanded, onToggle }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.faqItem, { backgroundColor: theme.colors.surface }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <GSText variant="body" weight="semiBold" style={styles.faqQuestion}>
          {faq.question}
        </GSText>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textSecondary}
        />
      </View>

      {isExpanded && (
        <GSText variant="body" color="textSecondary" style={styles.faqAnswer}>
          {faq.answer}
        </GSText>
      )}
    </TouchableOpacity>
  );
};

interface ContactOptionProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
}

const ContactOption: React.FC<ContactOptionProps> = ({ icon, title, description, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.contactOption, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.contactIconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
        <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
      </View>

      <View style={styles.contactInfo}>
        <GSText variant="body" weight="semiBold">
          {title}
        </GSText>
        <GSText variant="caption" color="textSecondary">
          {description}
        </GSText>
      </View>

      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
};

export default function SupportScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const faqs: FAQ[] = [
    {
      id: '1',
      question: t('support.faqs.trackOrder.question'),
      answer: t('support.faqs.trackOrder.answer'),
    },
    {
      id: '2',
      question: t('support.faqs.returnPolicy.question'),
      answer: t('support.faqs.returnPolicy.answer'),
    },
    {
      id: '3',
      question: t('support.faqs.shippingTime.question'),
      answer: t('support.faqs.shippingTime.answer'),
    },
    {
      id: '4',
      question: t('support.faqs.paymentMethods.question'),
      answer: t('support.faqs.paymentMethods.answer'),
    },
    {
      id: '5',
      question: t('support.faqs.changeOrder.question'),
      answer: t('support.faqs.changeOrder.answer'),
    },
    {
      id: '6',
      question: t('support.faqs.internationalShipping.question'),
      answer: t('support.faqs.internationalShipping.answer'),
    },
    {
      id: '7',
      question: t('support.faqs.couponCode.question'),
      answer: t('support.faqs.couponCode.answer'),
    },
    {
      id: '8',
      question: t('support.faqs.gshopTokens.question'),
      answer: t('support.faqs.gshopTokens.answer'),
    },
  ];

  const handleToggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@gshop.com?subject=Support Request');
  };

  const handleCallSupport = () => {
    Alert.alert(t('support.callSupportTitle'), t('support.callSupportMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('support.call'),
        onPress: () => Linking.openURL('tel:+541112345678'),
      },
    ]);
  };

  const handleLiveChat = () => {
    Alert.alert(t('support.liveChat'), t('support.liveChatComingSoon'));
  };

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      Alert.alert(t('support.missingInfo'), t('support.fillAllFields'));
      return;
    }

    try {
      setSubmitting(true);

      // TODO: Replace with actual API call
      // await supportService.submitTicket({ subject: ticketSubject, message: ticketMessage });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        t('support.ticketSubmitted'),
        t('support.ticketSubmittedMessage'),
        [
          {
            text: 'OK',
            onPress: () => {
              setTicketSubject('');
              setTicketMessage('');
              setShowTicketForm(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      Alert.alert(t('common.error'), t('support.ticketSubmitError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contact Us Section */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('support.contactUs')}
          </GSText>

          <ContactOption
            icon="mail-outline"
            title={t('support.emailSupport')}
            description={t('support.emailDescription')}
            onPress={handleEmailSupport}
          />

          <ContactOption
            icon="call-outline"
            title={t('support.callUs')}
            description={t('support.callDescription')}
            onPress={handleCallSupport}
          />

          <ContactOption
            icon="chatbubbles-outline"
            title={t('support.liveChat')}
            description={t('support.liveChatDescription')}
            onPress={handleLiveChat}
          />
        </View>

        {/* Frequently Asked Questions */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('support.faq')}
          </GSText>

          {faqs.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isExpanded={expandedFaq === faq.id}
              onToggle={() => handleToggleFaq(faq.id)}
            />
          ))}
        </View>

        {/* Submit a Ticket */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('support.submitTicket')}
          </GSText>

          {!showTicketForm ? (
            <TouchableOpacity
              style={[styles.submitTicketButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowTicketForm(true)}
            >
              <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
              <GSText variant="body" color="primary" style={{ marginLeft: 12 }}>
                {t('support.createNewTicket')}
              </GSText>
            </TouchableOpacity>
          ) : (
            <View style={[styles.ticketForm, { backgroundColor: theme.colors.surface }]}>
              <GSText variant="body" weight="semiBold" style={styles.formLabel}>
                {t('support.subject')}
              </GSText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: '#E5E7EB',
                  },
                ]}
                placeholder={t('support.subjectPlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                value={ticketSubject}
                onChangeText={setTicketSubject}
              />

              <GSText variant="body" weight="semiBold" style={styles.formLabel}>
                {t('support.message')}
              </GSText>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: '#E5E7EB',
                  },
                ]}
                placeholder={t('support.messagePlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                value={ticketMessage}
                onChangeText={setTicketMessage}
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
              />

              <View style={styles.formButtons}>
                <GSButton
                  title={t('common.cancel')}
                  onPress={() => {
                    setShowTicketForm(false);
                    setTicketSubject('');
                    setTicketMessage('');
                  }}
                  variant="outline"
                  style={styles.formButton}
                />
                <GSButton
                  title={t('support.submit')}
                  onPress={handleSubmitTicket}
                  loading={submitting}
                  style={styles.formButton}
                />
              </View>
            </View>
          )}
        </View>

        {/* Additional Resources */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('support.additionalResources')}
          </GSText>

          <TouchableOpacity style={styles.resourceLink}>
            <GSText variant="body" color="primary">
              {t('support.privacyPolicy')}
            </GSText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceLink}>
            <GSText variant="body" color="primary">
              {t('support.termsOfService')}
            </GSText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceLink}>
            <GSText variant="body" color="primary">
              {t('support.shippingInfo')}
            </GSText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceLink}>
            <GSText variant="body" color="primary">
              {t('support.returnRefundPolicy')}
            </GSText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  faqItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    marginTop: 12,
    lineHeight: 22,
  },
  submitTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ticketForm: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  formLabel: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 120,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
  },
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
});
