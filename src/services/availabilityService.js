/**
 * Availability Service - Phase 2
 *
 * Provider availability schedule management
 * Allows providers to set weekly recurring availability hours
 */

import apiService from './api';
import { API_ENDPOINTS } from '../constants/api';

class AvailabilityService {
  /**
   * ============================================================================
   * AVAILABILITY MANAGEMENT
   * ============================================================================
   */

  /**
   * Get provider's availability schedule
   *
   * @returns {Promise<Array>} Array of availability slots
   * Each slot: { id, day_of_week, start_time, end_time, is_active }
   */
  async getAvailability() {
    try {
      const response = await apiService.get(API_ENDPOINTS.MY_AVAILABILITY);
      return response;
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  }

  /**
   * Set/Update availability schedule (bulk replace)
   * Replaces all existing slots with new ones
   *
   * @param {Array} slots - Array of availability slots
   * Each slot: { day_of_week, start_time, end_time }
   * @returns {Promise<Object>} Updated availability
   */
  async setAvailability(slots) {
    try {
      const response = await apiService.put(API_ENDPOINTS.MY_AVAILABILITY, {
        slots
      });
      return response;
    } catch (error) {
      console.error('Error setting availability:', error);
      throw error;
    }
  }

  /**
   * Add a single availability slot
   *
   * @param {Object} slot - Availability slot
   * { day_of_week, start_time, end_time }
   * @returns {Promise<Object>} Created slot
   */
  async addAvailabilitySlot(slot) {
    try {
      const response = await apiService.post(API_ENDPOINTS.MY_AVAILABILITY, slot);
      return response;
    } catch (error) {
      console.error('Error adding availability slot:', error);
      throw error;
    }
  }

  /**
   * Delete an availability slot
   *
   * @param {string} slotId - Slot ID to delete
   * @returns {Promise<Object>} Response
   */
  async deleteAvailabilitySlot(slotId) {
    try {
      const response = await apiService.delete(
        API_ENDPOINTS.AVAILABILITY_SLOT(slotId)
      );
      return response;
    } catch (error) {
      console.error('Error deleting availability slot:', error);
      throw error;
    }
  }

  /**
   * Update a single availability slot
   *
   * @param {string} slotId - Slot ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated slot
   */
  async updateAvailabilitySlot(slotId, updates) {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.AVAILABILITY_SLOT(slotId),
        updates
      );
      return response;
    } catch (error) {
      console.error('Error updating availability slot:', error);
      throw error;
    }
  }

  /**
   * ============================================================================
   * HELPER METHODS
   * ============================================================================
   */

  /**
   * Get day name from day_of_week number
   *
   * @param {number} dayOfWeek - 0=Sunday, 6=Saturday
   * @returns {string} Day name
   */
  getDayName(dayOfWeek) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }

  /**
   * Get short day name
   *
   * @param {number} dayOfWeek - 0=Sunday, 6=Saturday
   * @returns {string} Short day name (3 letters)
   */
  getShortDayName(dayOfWeek) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayOfWeek] || '???';
  }

  /**
   * Format time from 24h to 12h format
   *
   * @param {string} time24 - Time in 24h format (HH:MM or HH:MM:SS)
   * @returns {string} Time in 12h format (h:MM AM/PM)
   */
  formatTime12h(time24) {
    if (!time24) return '';

    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;

    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Format time from 12h to 24h format
   *
   * @param {string} time12 - Time in 12h format (h:MM AM/PM)
   * @returns {string} Time in 24h format (HH:MM)
   */
  formatTime24h(time12) {
    if (!time12) return '';

    const [time, period] = time12.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Validate time format (HH:MM)
   *
   * @param {string} time - Time string
   * @returns {boolean} True if valid
   */
  isValidTimeFormat(time) {
    if (!time) return false;
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
  }

  /**
   * Check if time1 is before time2
   *
   * @param {string} time1 - First time (HH:MM)
   * @param {string} time2 - Second time (HH:MM)
   * @returns {boolean} True if time1 < time2
   */
  isTimeBefore(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);

    return h1 < h2 || (h1 === h2 && m1 < m2);
  }

  /**
   * Calculate duration between two times in minutes
   *
   * @param {string} startTime - Start time (HH:MM)
   * @param {string} endTime - End time (HH:MM)
   * @returns {number} Duration in minutes
   */
  calculateDuration(startTime, endTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    return endMinutes - startMinutes;
  }

  /**
   * Validate availability slot
   *
   * @param {Object} slot - Slot to validate
   * @returns {Object} { valid: boolean, errors: Array<string> }
   */
  validateSlot(slot) {
    const errors = [];

    // Validate day_of_week
    if (typeof slot.day_of_week !== 'number' || slot.day_of_week < 0 || slot.day_of_week > 6) {
      errors.push('Invalid day of week (must be 0-6)');
    }

    // Validate time format
    if (!this.isValidTimeFormat(slot.start_time)) {
      errors.push('Invalid start time format (must be HH:MM)');
    }

    if (!this.isValidTimeFormat(slot.end_time)) {
      errors.push('Invalid end time format (must be HH:MM)');
    }

    // Validate time order
    if (slot.start_time && slot.end_time) {
      if (!this.isTimeBefore(slot.start_time, slot.end_time)) {
        errors.push('End time must be after start time');
      }

      // Validate minimum duration (1 hour)
      const duration = this.calculateDuration(slot.start_time, slot.end_time);
      if (duration < 60) {
        errors.push('Minimum availability slot is 1 hour');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for overlapping slots on the same day
   *
   * @param {Array} slots - Array of slots
   * @returns {Array} Array of conflict descriptions
   */
  findOverlappingSlots(slots) {
    const conflicts = [];

    // Group by day
    const slotsByDay = {};
    slots.forEach(slot => {
      if (!slotsByDay[slot.day_of_week]) {
        slotsByDay[slot.day_of_week] = [];
      }
      slotsByDay[slot.day_of_week].push(slot);
    });

    // Check each day for overlaps
    Object.entries(slotsByDay).forEach(([day, daySlots]) => {
      for (let i = 0; i < daySlots.length; i++) {
        for (let j = i + 1; j < daySlots.length; j++) {
          const slot1 = daySlots[i];
          const slot2 = daySlots[j];

          // Check if slots overlap
          const s1Start = slot1.start_time;
          const s1End = slot1.end_time;
          const s2Start = slot2.start_time;
          const s2End = slot2.end_time;

          const overlaps = !(
            this.isTimeBefore(s1End, s2Start) || // slot1 ends before slot2 starts
            this.isTimeBefore(s2End, s1Start)    // slot2 ends before slot1 starts
          );

          if (overlaps) {
            conflicts.push(
              `${this.getDayName(parseInt(day))}: ${s1Start}-${s1End} overlaps with ${s2Start}-${s2End}`
            );
          }
        }
      }
    });

    return conflicts;
  }

  /**
   * Get default availability (9 AM - 5 PM, Monday-Friday)
   *
   * @returns {Array} Array of default slots
   */
  getDefaultAvailability() {
    return [
      { day_of_week: 1, start_time: '09:00', end_time: '17:00' }, // Monday
      { day_of_week: 2, start_time: '09:00', end_time: '17:00' }, // Tuesday
      { day_of_week: 3, start_time: '09:00', end_time: '17:00' }, // Wednesday
      { day_of_week: 4, start_time: '09:00', end_time: '17:00' }, // Thursday
      { day_of_week: 5, start_time: '09:00', end_time: '17:00' }, // Friday
    ];
  }

  /**
   * Convert availability to weekly schedule object
   *
   * @param {Array} slots - Availability slots
   * @returns {Object} Weekly schedule { 0: [...], 1: [...], ... }
   */
  toWeeklySchedule(slots) {
    const schedule = {};

    // Initialize all days
    for (let i = 0; i < 7; i++) {
      schedule[i] = [];
    }

    // Fill in slots
    slots.forEach(slot => {
      if (slot.is_active) {
        schedule[slot.day_of_week].push({
          start: slot.start_time,
          end: slot.end_time,
          id: slot.id
        });
      }
    });

    return schedule;
  }

  /**
   * Check if provider is available at specific time
   *
   * @param {Array} slots - Availability slots
   * @param {Date} datetime - Date/time to check
   * @returns {boolean} True if available
   */
  isAvailableAt(slots, datetime) {
    const dayOfWeek = datetime.getDay();
    const hours = datetime.getHours();
    const minutes = datetime.getMinutes();
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Find slots for this day
    const daySlots = slots.filter(
      slot => slot.day_of_week === dayOfWeek && slot.is_active
    );

    // Check if time falls within any slot
    return daySlots.some(slot => {
      return !this.isTimeBefore(timeString, slot.start_time) &&
             this.isTimeBefore(timeString, slot.end_time);
    });
  }

  /**
   * Get next available time slot
   *
   * @param {Array} slots - Availability slots
   * @param {Date} fromDate - Start searching from this date
   * @returns {Object|null} { day, date, startTime, endTime } or null
   */
  getNextAvailableSlot(slots, fromDate = new Date()) {
    const activeSlots = slots.filter(s => s.is_active);
    if (activeSlots.length === 0) return null;

    // Search up to 7 days ahead
    for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
      const checkDate = new Date(fromDate);
      checkDate.setDate(checkDate.getDate() + daysAhead);
      const dayOfWeek = checkDate.getDay();

      const daySlots = activeSlots.filter(s => s.day_of_week === dayOfWeek);

      if (daySlots.length > 0) {
        // Return first slot of the day
        const slot = daySlots[0];
        return {
          day: this.getDayName(dayOfWeek),
          date: checkDate,
          startTime: slot.start_time,
          endTime: slot.end_time
        };
      }
    }

    return null;
  }
}

export default new AvailabilityService();
