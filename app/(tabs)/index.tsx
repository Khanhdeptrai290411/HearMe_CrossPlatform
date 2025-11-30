import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getVideoUrl } from '@/constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isWeb = Platform.OS === 'web';

// Helper function to get image URLs from public folder
const getImageUrl = (path: string) => {
  return getVideoUrl(path); // Reuse same Metro URL logic
};

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            Connecting People Through{' '}
            <Text style={styles.heroHighlight}>Sign Language</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            <Text style={styles.brandHighlight}>HearMe</Text> is dedicated to breaking down communication barriers by making sign language learning accessible, engaging, and effective for everyone.
          </Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/lessons')}
            >
              <Text style={styles.primaryButtonText}>Explore Our Courses</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Mission & Vision */}
      <View style={styles.section}>
        <View style={styles.cardRow}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Text style={styles.icon}>🎯</Text>
              </View>
              <Text style={styles.cardTitle}>Our Mission</Text>
            </View>
            <Text style={styles.cardText}>
              Our mission is to empower individuals to learn sign language through an accessible, interactive, and effective online platform.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Text style={styles.icon}>💡</Text>
              </View>
              <Text style={styles.cardTitle}>Our Vision</Text>
            </View>
            <Text style={styles.cardText}>
              We envision a world where sign language is widely recognized, respected, and learned, breaking down barriers between deaf and hearing communities.
            </Text>
          </View>
        </View>
      </View>

      {/* Core Values */}
      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Core Values</Text>
        <View style={styles.valuesGrid}>
          {[
            { icon: '❤️', title: 'Inclusion', desc: 'Everyone deserves access to communication.' },
            { icon: '🎯', title: 'Innovation', desc: 'Cutting-edge technology for effective learning.' },
            { icon: '📚', title: 'Education', desc: 'High-quality content for all levels.' },
            { icon: '🌐', title: 'Accessibility', desc: 'Features for diverse learning needs.' },
            { icon: '👥', title: 'Community', desc: 'Supportive learning environment.' },
            { icon: '⭐', title: 'Excellence', desc: 'Highest standards in everything we do.' },
          ].map((value, index) => (
            <View key={index} style={styles.valueCard}>
              <Text style={styles.valueIcon}>{value.icon}</Text>
              <Text style={styles.valueTitle}>{value.title}</Text>
              <Text style={styles.valueDesc}>{value.desc}</Text>
            </View>
          ))}
        </View>
      </View> */}

      {/* Our Story Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Story</Text>
        <View style={styles.storyContainer}>
          <View style={styles.storyContent}>
            <Text style={styles.storyText}>
              HearMe was born from a personal experience. Our founders, Quốc Khánh and Thảo Nguyên, witnessed firsthand the communication barriers faced by their deaf cousin in everyday situations. This inspired them to create a solution that would make sign language learning accessible to everyone.
            </Text>
            <Text style={styles.storyText}>
              In 2025, with a small team of passionate educators and developers, HearMe was launched with a simple goal: to create an engaging, effective, and accessible platform for learning sign language.
            </Text>
            <Text style={styles.storyText}>
              What started as a collection of basic ASL lessons has grown into a comprehensive platform offering multiple sign languages, interactive practice tools, a supportive community, and partnerships with organizations worldwide.
            </Text>
            <Text style={styles.storyText}>
              Today, HearMe serves learners across the globe, from families wanting to communicate with deaf loved ones to professionals seeking to make their services more inclusive. Our journey continues as we expand our offerings and improve our technology to better serve our mission.
            </Text>
          </View>
          <Image 
            source={{ uri: getImageUrl('/Team.jpg') }}
            style={styles.storyImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Team Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meet Our Team</Text>
        <Text style={styles.sectionSubtitle}>
          Our passionate team of experts dedicated to making sign language learning accessible to everyone.
        </Text>
        <View style={styles.teamGrid}>
          {[
            { 
              name: 'Quốc Khánh', 
              role: 'Development Team Lead', 
              image: '/Khanh.jpg', 
              desc: 'Quốc Khánh leads our development team, bringing innovative technical solutions and AI-powered features to the platform.' 
            },
            { 
              name: 'Thảo Nguyên', 
              role: 'Content Director', 
              image: '/Nguyen.jpg', 
              desc: 'Thảo Nguyên oversees all educational content at HearMe, bringing expertise in linguistics and pedagogy to create effective learning experiences.' 
            },
          ].map((member, index) => (
            <View key={index} style={styles.teamCard}>
              <Image 
                source={{ uri: getImageUrl(member.image) }}
                style={styles.teamImage}
                resizeMode="cover"
              />
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
                <Text style={styles.teamDesc}>{member.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Achievements</Text>
        <View style={styles.achievementContainer}>
          <View style={styles.achievementTextSection}>
            <View style={styles.achievementCard}>
              <Text style={styles.achievementTitle}>AI For Life 2024 Finalist</Text>
              <Text style={styles.achievementText}>
                Our team HearMe proudly made it to the finals of "Trí Tuệ Nhân Tạo & Ứng Dụng - DaNang AI For Life 2024" 
                competition, showcasing our innovative approach to making sign language learning accessible through technology.
              </Text>
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>AI Technology</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Innovation</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Social Impact</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.achievementCard}>
              <Text style={styles.achievementTitle}>Recognized by VKU & KOICA</Text>
              <Text style={styles.achievementText}>
                Our project received recognition from Vietnam-Korea University of Information and Communication Technology (VKU) 
                and Korea International Cooperation Agency (KOICA), validating our mission to bridge communication gaps through technology.
              </Text>
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>International Recognition</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Educational Technology</Text>
                </View>
              </View>
            </View>
          </View>
          
          <Image 
            source={{ uri: getImageUrl('/Certificate.jpg') }}
            style={styles.certificateImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Testimonials */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What Our Users Say</Text>
        <View style={styles.testimonialsGrid}>
          {[
            { 
              name: 'Anh Việt', 
              role: 'Student', 
              image: '/Viet.jpg',
              quote: 'HearMe has transformed how I communicate with my deaf cousin. The interactive lessons and practice tools made learning sign language enjoyable and effective.'
            },
            { 
              name: 'Quốc Khánh', 
              role: 'Special Education Teacher', 
              image: '/Khanh.jpg',
              quote: 'As an educator working with deaf students, I\'ve recommended HearMe to countless parents and colleagues. The structured curriculum and visual approach are perfect for beginners.'
            },
            { 
              name: 'Thảo Nguyên', 
              role: 'Healthcare Professional', 
              image: '/Nguyen.jpg',
              quote: 'The community aspect of HearMe sets it apart from other language learning platforms. Being able to practice with other learners and get feedback from native signers has accelerated my progress.'
            },
          ].map((testimonial, index) => (
            <View key={index} style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <Image 
                  source={{ uri: getImageUrl(testimonial.image) }}
                  style={styles.testimonialAvatar}
                  resizeMode="cover"
                />
                <View style={styles.testimonialInfo}>
                  <Text style={styles.testimonialName}>{testimonial.name}</Text>
                  <Text style={styles.testimonialRole}>{testimonial.role}</Text>
                </View>
              </View>
              <Text style={styles.testimonialQuote}>"{testimonial.quote}"</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Join Our Mission</Text>
        <Text style={styles.ctaText}>
          Be part of our journey to make sign language learning accessible to everyone. Start your learning journey today!
        </Text>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => router.push('/lessons')}
        >
          <Text style={styles.ctaButtonText}>Start Learning →</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>HearMe Learning v1.0</Text>
        <Text style={styles.footerSubtext}>Making sign language accessible to everyone</Text>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  heroSection: {
    backgroundColor: '#EEF2FF',
    paddingVertical: isTablet ? 80 : 40,
    paddingHorizontal: isTablet ? 60 : 20,
    marginBottom: 40,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroHighlight: {
    color: '#6366f1',
  },
  heroSubtitle: {
    fontSize: isTablet ? 18 : 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  brandHighlight: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#6366f1',
    textShadowColor: 'rgba(99, 102, 241, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: isTablet ? 60 : 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: isTablet ? 32 : 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  cardRow: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardText: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isTablet ? 12 : 8,
  },
  valueCard: {
    width: isTablet ? 'calc(33.33% - 8px)' : 'calc(50% - 6px)',
    backgroundColor: '#ffffff',
    borderRadius: isTablet ? 12 : 8,
    padding: isTablet ? 16 : 12,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    minWidth: isTablet ? 200 : 140,
  },
  valueIcon: {
    fontSize: isTablet ? 32 : 28,
    marginBottom: isTablet ? 8 : 6,
  },
  valueTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: isTablet ? 4 : 2,
  },
  valueDesc: {
    fontSize: isTablet ? 13 : 12,
    color: '#6b7280',
    lineHeight: isTablet ? 18 : 16,
  },
  storyContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 20,
  },
  storyContent: {
    flex: 1,
    gap: 16,
  },
  storyText: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    textAlign: 'justify',
  },
  storyImage: {
    width: isTablet ? '45%' : '100%',
    height: isTablet ? 400 : 250,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  teamGrid: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: isTablet ? 24 : 16,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  teamCard: {
    flex: isTablet ? 0.8 : 1,
    maxWidth: isTablet ? 400 : '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
  },
  teamInfo: {
    padding: isTablet ? 20 : 16,
  },
  teamName: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  teamRole: {
    fontSize: isTablet ? 15 : 14,
    color: '#6366f1',
    marginBottom: 12,
    fontWeight: '500',
  },
  teamDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  achievementContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 20,
  },
  achievementTextSection: {
    flex: 1,
    gap: 16,
  },
  achievementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  certificateImage: {
    width: isTablet ? '45%' : '100%',
    aspectRatio: 1.5, // landscape ratio
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  achievementText: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  testimonialsGrid: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 16,
  },
  testimonialCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  testimonialAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  testimonialRole: {
    fontSize: 13,
    color: '#6b7280',
  },
  testimonialQuote: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#e0e7ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    color: '#4338ca',
    fontWeight: '500',
  },
  ctaSection: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: isTablet ? 40 : 24,
    marginHorizontal: isTablet ? 60 : 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: isTablet ? 28 : 22,
    fontWeight: 'bold',
    color: '#4338ca',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 16,
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#d1d5db',
  },
});
