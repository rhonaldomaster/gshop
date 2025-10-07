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
        <GSText variant="body" weight="semibold" style={styles.faqQuestion}>
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
        <GSText variant="body" weight="semibold">
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

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I track my order?',
      answer:
        'You can track your order by going to "My Orders" in your profile, then tap on the order you want to track. You\'ll see real-time updates on your order status and delivery progress.',
    },
    {
      id: '2',
      question: 'What is your return policy?',
      answer:
        'We accept returns within 30 days of delivery. Items must be unused and in original packaging. Simply go to your order details and click "Request Return". Refunds are processed within 5-7 business days after we receive the item.',
    },
    {
      id: '3',
      question: 'How long does shipping take?',
      answer:
        'Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days. Same-day delivery is available in select areas. You can see estimated delivery dates at checkout.',
    },
    {
      id: '4',
      question: 'What payment methods do you accept?',
      answer:
        'We accept credit/debit cards (Visa, Mastercard, American Express), MercadoPago, USDC cryptocurrency, and GSHOP tokens. All payments are processed securely.',
    },
    {
      id: '5',
      question: 'How do I change or cancel my order?',
      answer:
        'You can cancel or modify your order within 1 hour of placing it. Go to "My Orders", select the order, and click "Cancel Order" or "Modify Order". After processing begins, contact support for assistance.',
    },
    {
      id: '6',
      question: 'Do you offer international shipping?',
      answer:
        'Currently, we ship within Colombia only. We\'re working on expanding to other Latin American countries soon. Subscribe to our newsletter to get notified when we expand.',
    },
    {
      id: '7',
      question: 'How do I use a coupon code?',
      answer:
        'Enter your coupon code at checkout in the "Promo Code" field. The discount will be applied automatically. Make sure the code is valid and meets any minimum purchase requirements.',
    },
    {
      id: '8',
      question: 'What are GSHOP tokens and how do I earn them?',
      answer:
        'GSHOP tokens are our reward currency. You earn 5% cashback on all purchases. Tokens can be used for future purchases. Check your wallet in the Profile section to see your balance.',
    },
  ];

  const handleToggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@gshop.com?subject=Support Request');
  };

  const handleCallSupport = () => {
    Alert.alert('Call Support', 'Would you like to call our support team?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call',
        onPress: () => Linking.openURL('tel:+541112345678'),
      },
    ]);
  };

  const handleLiveChat = () => {
    Alert.alert('Live Chat', 'Live chat is coming soon! For now, please use email or phone support.');
  };

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and message fields.');
      return;
    }

    try {
      setSubmitting(true);

      // TODO: Replace with actual API call
      // await supportService.submitTicket({ subject: ticketSubject, message: ticketMessage });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Ticket Submitted',
        'Your support ticket has been submitted. We\'ll get back to you within 24 hours.',
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
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
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
            Contact Us
          </GSText>

          <ContactOption
            icon="mail-outline"
            title="Email Support"
            description="support@gshop.com • 24h response"
            onPress={handleEmailSupport}
          />

          <ContactOption
            icon="call-outline"
            title="Call Us"
            description="+54 11 1234 5678 • Mon-Fri 9AM-6PM"
            onPress={handleCallSupport}
          />

          <ContactOption
            icon="chatbubbles-outline"
            title="Live Chat"
            description="Chat with us in real-time"
            onPress={handleLiveChat}
          />
        </View>

        {/* Frequently Asked Questions */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Frequently Asked Questions
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
            Submit a Support Ticket
          </GSText>

          {!showTicketForm ? (
            <TouchableOpacity
              style={[styles.submitTicketButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setShowTicketForm(true)}
            >
              <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
              <GSText variant="body" color="primary" style={{ marginLeft: 12 }}>
                Create New Ticket
              </GSText>
            </TouchableOpacity>
          ) : (
            <View style={[styles.ticketForm, { backgroundColor: theme.colors.surface }]}>
              <GSText variant="body" weight="semibold" style={styles.formLabel}>
                Subject
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
                placeholder="Brief description of your issue"
                placeholderTextColor={theme.colors.textSecondary}
                value={ticketSubject}
                onChangeText={setTicketSubject}
              />

              <GSText variant="body" weight="semibold" style={styles.formLabel}>
                Message
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
                placeholder="Please describe your issue in detail..."
                placeholderTextColor={theme.colors.textSecondary}
                value={ticketMessage}
                onChangeText={setTicketMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <View style={styles.formButtons}>
                <GSButton
                  title="Cancel"
                  onPress={() => {
                    setShowTicketForm(false);
                    setTicketSubject('');
                    setTicketMessage('');
                  }}
                  variant="outline"
                  style={styles.formButton}
                />
                <GSButton
                  title="Submit"
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
            Additional Resources
          </GSText>

          <TouchableOpacity style={styles.resourceLink}>
            <GSText variant="body" color="primary">
              Privacy Policy
            </GSText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceLink}>
            <GSText variant="body" color="primary">
              Terms of Service
            </GSText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceLink}>
            <GSText variant="body" color="primary">
              Shipping Information
            </GSText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceLink}>
            <GSText variant="body" color="primary">
              Return & Refund Policy
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
