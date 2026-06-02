import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import EventAttendance from '../models/EventAttendance.js';
import EventNotification from '../models/EventNotification.js';
import User from '../models/User.js';

// Helper to push notification via Socket.io
const emitNotification = (req, userId, notification) => {
  const io = req.app.get('io');
  if (io) {
    io.to(userId.toString()).emit('newNotification', notification);
  }
};

/**
 * @desc    Create a hiring event
 * @route   POST /api/events/create
 * @access  Private (Company)
 */
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      hiringType,
      location,
      eventDate,
      startTime,
      endTime,
      positionsCount,
      requiredSkills,
      salaryRange,
      registrationDeadline,
      eventMode,
      bannerImage,
      virtualLink,
      slots,
    } = req.body;

    const companyId = req.user._id;
    // Get company details
    const company = await User.findById(companyId);
    const companyName = company.companyProfile?.companyName || company.name;
    const companyLogo = company.avatar || '';

    // Parse location coordinates
    let formattedLocation = {
      type: 'Point',
      coordinates: [0, 0],
      address: '',
      city: '',
    };

    if (location) {
      formattedLocation = {
        type: 'Point',
        coordinates: [
          parseFloat(location.longitude) || 0,
          parseFloat(location.latitude) || 0,
        ],
        address: location.address || '',
        city: location.city || '',
      };
    }

    // Default slots if none provided
    let eventSlots = slots;
    if (!eventSlots || eventSlots.length === 0) {
      eventSlots = [
        { time: '09:00 AM - 10:00 AM', maxCapacity: 15 },
        { time: '10:00 AM - 11:00 AM', maxCapacity: 15 },
        { time: '11:00 AM - 12:00 PM', maxCapacity: 15 },
        { time: '01:00 PM - 02:00 PM', maxCapacity: 15 },
        { time: '02:00 PM - 03:00 PM', maxCapacity: 15 },
        { time: '03:00 PM - 04:00 PM', maxCapacity: 15 },
        { time: '04:00 PM - 05:00 PM', maxCapacity: 15 },
      ];
    }

    const event = await Event.create({
      title,
      company: companyId,
      companyName,
      companyLogo,
      description,
      hiringType: Array.isArray(hiringType) ? hiringType : [hiringType],
      location: formattedLocation,
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      eventDate: new Date(eventDate),
      startTime,
      endTime,
      positionsCount: parseInt(positionsCount) || 1,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills ? [requiredSkills] : [],
      salaryRange,
      registrationDeadline: new Date(registrationDeadline),
      eventMode,
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60', // beautiful default banner
      virtualLink: eventMode !== 'offline' ? virtualLink : '',
      slots: eventSlots,
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update a hiring event
 * @route   PUT /api/events/update/:id or PUT /api/events/:id or PUT /api/events/update
 * @access  Private (Company)
 */
export const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id || req.body.id;
    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    let event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Verify ownership
    if (event.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    }

    const updates = { ...req.body };
    if (updates.eventDate) updates.eventDate = new Date(updates.eventDate);
    if (updates.registrationDeadline) updates.registrationDeadline = new Date(updates.registrationDeadline);
    
    if (updates.location) {
      updates.location = {
        type: 'Point',
        coordinates: [
          parseFloat(updates.location.longitude) || event.location.coordinates[0],
          parseFloat(updates.location.latitude) || event.location.coordinates[1],
        ],
        address: updates.location.address || event.location.address,
        city: updates.location.city || event.location.city,
      };
      updates.latitude = updates.location.coordinates[1];
      updates.longitude = updates.location.coordinates[0];
    }

    event = await Event.findByIdAndUpdate(eventId, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a hiring event
 * @route   DELETE /api/events/delete/:id or DELETE /api/events/:id or DELETE /api/events/delete
 * @access  Private (Company)
 */
export const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id || req.body.id || req.query.id;
    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Verify ownership
    if (event.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(eventId);
    // Delete all registrations associated with this event
    await EventRegistration.deleteMany({ event: eventId });
    await EventAttendance.deleteMany({ event: eventId });
    await EventNotification.deleteMany({ event: eventId });

    res.json({
      success: true,
      message: 'Event and related assets deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get events created by logged-in company
 * @route   GET /api/events/company
 * @access  Private (Company)
 */
export const getCompanyEvents = async (req, res) => {
  try {
    const events = await Event.find({ company: req.user._id }).sort({ eventDate: 1 });
    
    // Add registration and check-in counts for company view
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const regCount = await EventRegistration.countDocuments({ event: event._id });
        const checkinCount = await EventRegistration.countDocuments({
          event: event._id,
          status: { $in: ['checked_in', 'interviewed', 'selected', 'rejected'] },
        });
        return {
          ...event.toObject(),
          registrationsCount: regCount,
          attendanceCount: checkinCount,
        };
      })
    );

    res.json({
      success: true,
      count: eventsWithStats.length,
      data: eventsWithStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all events with filters (Discovery)
 * @route   GET /api/events
 * @access  Public / Private
 */
export const getEvents = async (req, res) => {
  try {
    const { category, type, search, lat, lng, radius } = req.query;
    let query = { status: 'published' };

    // Filter by tab categories
    if (category) {
      if (category === 'student') {
        query.hiringType = { $in: ['Internship', 'Part-Time'] };
      } else if (category === 'daily') {
        query.hiringType = 'Daily Workers';
      }
    }

    // Filter by Event Type (hiringType list)
    if (type) {
      query.hiringType = type;
    }

    // Search keyword in title, companyName, description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Nearby filter (2dsphere index query)
    if (lat && lng) {
      const maxDistance = (parseInt(radius) || 50) * 1000; // default 50km in meters
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: maxDistance,
        },
      };
    }

    let events = [];
    
    if (lat && lng) {
      // Near query returns documents sorted by distance
      events = await Event.find(query);
    } else {
      events = await Event.find(query).sort({ eventDate: 1 });
    }

    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const regCount = await EventRegistration.countDocuments({ event: event._id });
        return {
          ...event.toObject(),
          vacancies: event.positionsCount,
          registrationsCount: regCount,
        };
      })
    );

    // Apply trending logic in memory if requested
    if (category === 'trending') {
      eventsWithStats.sort((a, b) => b.registrationsCount - a.registrationsCount);
    }

    res.json({
      success: true,
      count: eventsWithStats.length,
      data: eventsWithStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get event details by ID, including registration status of logged-in user
 * @route   GET /api/events/:id
 * @access  Private / Public
 */
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    let registration = null;
    let registrationsCount = await EventRegistration.countDocuments({ event: event._id });

    // Check if authenticated worker is registered
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
        import('jsonwebtoken').then(async (jwt) => {
          const decoded = jwt.default.verify(token, jwtSecret);
          if (decoded && decoded.id) {
            registration = await EventRegistration.findOne({
              event: event._id,
              user: decoded.id,
            });
          }
        });
      } catch (err) {
        // Token verification failed or route accessed publicly, proceed without registration info
      }
    }

    // Fallback: If JWT verification is async and doesn't finish, we query using req.user if populated
    if (!registration && req.user && req.user.role === 'worker') {
      registration = await EventRegistration.findOne({
        event: event._id,
        user: req.user._id,
      });
    }

    // Fetch candidate registrations details if requested by organizing company
    let candidates = [];
    if (req.user && req.user.role === 'company' && event.company.toString() === req.user._id.toString()) {
      candidates = await EventRegistration.find({ event: event._id })
        .sort({ rankingScore: -1, createdAt: -1 })
        .populate('user', 'rating avatar workerProfile');
    }

    res.json({
      success: true,
      data: {
        ...event.toObject(),
        registrationsCount,
        registration,
        candidates,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Register worker/student for event
 * @route   POST /api/events/register
 * @access  Private (Worker)
 */
export const registerForEvent = async (req, res) => {
  try {
    const { eventId, name, phone, email, skills, resume, slotTime } = req.body;
    const workerId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    // Check if already registered
    const existingReg = await EventRegistration.findOne({ event: eventId, user: workerId });
    if (existingReg) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    // Check slot booking capacity
    if (slotTime) {
      const slotIndex = event.slots.findIndex((s) => s.time === slotTime);
      if (slotIndex !== -1) {
        const slot = event.slots[slotIndex];
        if (slot.bookedCount >= slot.maxCapacity) {
          return res.status(400).json({ success: false, message: 'Selected interview slot is fully booked' });
        }
        // Increment slot booking
        event.slots[slotIndex].bookedCount += 1;
        await event.save();
      }
    }

    // Generate unique Registration ID
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digit
    const registrationId = `KS-EVT-${randomNum}`;
    
    // QR Code content - simple registrationId
    const qrCode = registrationId;

    // --- AI Candidate Ranking Calculation ---
    // Fetch registered worker data
    const worker = await User.findById(workerId);
    let rankingScore = 70; // default medium score if profile incomplete

    if (worker && worker.workerProfile) {
      const wp = worker.workerProfile;
      
      // 1. Skill Match (40% weight)
      let skillScore = 0;
      if (event.requiredSkills && event.requiredSkills.length > 0) {
        const matches = event.requiredSkills.filter((s) =>
          wp.skills.some((ws) => ws.toLowerCase() === s.toLowerCase())
        );
        skillScore = (matches.length / event.requiredSkills.length) * 100;
      } else {
        skillScore = 100; // no skills required
      }

      // 2. Rating Score (25% weight)
      const ratingScore = worker.rating ? (worker.rating / 5) * 100 : 70; // default 3.5 rating

      // 3. Proximity Score (20% weight)
      let proximityScore = 70;
      if (
        worker.location &&
        worker.location.coordinates &&
        event.location &&
        event.location.coordinates
      ) {
        // Calculate basic Euclidean distance in coordinate degree proxy
        const dx = worker.location.coordinates[0] - event.location.coordinates[0];
        const dy = worker.location.coordinates[1] - event.location.coordinates[1];
        const distanceKm = Math.sqrt(dx * dx + dy * dy) * 111; // approximate degrees to km
        
        if (distanceKm <= 5) proximityScore = 100;
        else if (distanceKm <= 20) proximityScore = 80;
        else if (distanceKm <= 50) proximityScore = 60;
        else proximityScore = 30;
      }

      // 4. Experience Score (15% weight)
      const experience = wp.experience || 0;
      const experienceScore = experience >= 5 ? 100 : (experience / 5) * 100;

      // Compound Score
      rankingScore = Math.round(
        skillScore * 0.40 +
        ratingScore * 0.25 +
        proximityScore * 0.20 +
        experienceScore * 0.15
      );
    }

    const registration = await EventRegistration.create({
      event: eventId,
      user: workerId,
      name,
      phone,
      email,
      skills: Array.isArray(skills) ? skills : skills ? [skills] : [],
      resume,
      registrationId,
      qrCode,
      interviewSlot: slotTime || '',
      rankingScore,
      status: 'registered',
    });

    // Create Event Notification & Emit Socket Alert
    const notification = await EventNotification.create({
      user: workerId,
      event: eventId,
      type: 'confirmation',
      title: 'Registration Confirmed!',
      message: `You have successfully registered for ${event.title}. Your Registration ID is ${registrationId}.`,
      data: { registrationId, eventId, slotTime },
    });
    
    emitNotification(req, workerId, notification);

    res.status(201).json({
      success: true,
      message: 'Registered successfully',
      data: registration,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Check-in worker at event via scanning QR Code / entering ID
 * @route   POST /api/events/checkin
 * @access  Private (Company / staff)
 */
export const checkInUser = async (req, res) => {
  try {
    const { registrationId, eventId } = req.body;

    const registration = await EventRegistration.findOne({ registrationId, event: eventId });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Invalid Registration ID for this event' });
    }

    if (registration.status !== 'registered') {
      return res.status(400).json({
        success: false,
        message: `Candidate is already checked in. Status: ${registration.status}`,
      });
    }

    // Update status to checked_in
    registration.status = 'checked_in';
    await registration.save();

    // Create EventAttendance record
    await EventAttendance.create({
      event: eventId,
      user: registration.user,
      registration: registration._id,
      checkedInBy: req.user._id,
    });

    const event = await Event.findById(eventId);

    // Create Notification for the user
    const notification = await EventNotification.create({
      user: registration.user,
      event: eventId,
      type: 'interview_schedule',
      title: 'Checked In Successfully!',
      message: `Welcome to ${event.title}! You have checked in. Please wait for your interview call.`,
      data: { registrationId, eventId },
    });

    emitNotification(req, registration.user, notification);

    res.json({
      success: true,
      message: 'Check-in completed successfully',
      data: registration,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Book / Change interview slot for event
 * @route   POST /api/events/:id/book-slot
 * @access  Private (Worker)
 */
export const bookInterviewSlot = async (req, res) => {
  try {
    const { slotTime } = req.body;
    const eventId = req.params.id;
    const workerId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const registration = await EventRegistration.findOne({ event: eventId, user: workerId });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // Check slot capacity
    const newSlotIndex = event.slots.findIndex((s) => s.time === slotTime);
    if (newSlotIndex === -1) {
      return res.status(400).json({ success: false, message: 'Interview slot invalid' });
    }

    const newSlot = event.slots[newSlotIndex];
    if (newSlot.bookedCount >= newSlot.maxCapacity) {
      return res.status(400).json({ success: false, message: 'Selected interview slot is fully booked' });
    }

    // Release old slot booking if exists
    if (registration.interviewSlot) {
      const oldSlotIndex = event.slots.findIndex((s) => s.time === registration.interviewSlot);
      if (oldSlotIndex !== -1) {
        event.slots[oldSlotIndex].bookedCount = Math.max(0, event.slots[oldSlotIndex].bookedCount - 1);
      }
    }

    // Book new slot
    event.slots[newSlotIndex].bookedCount += 1;
    await event.save();

    registration.interviewSlot = slotTime;
    await registration.save();

    // Create Notification
    const notification = await EventNotification.create({
      user: workerId,
      event: eventId,
      type: 'interview_schedule',
      title: 'Interview Slot Booked',
      message: `Your interview slot for ${event.title} has been booked/changed to ${slotTime}.`,
      data: { eventId, slotTime },
    });

    emitNotification(req, workerId, notification);

    res.json({
      success: true,
      message: 'Interview slot booked successfully',
      data: registration,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update single candidate's hiring status
 * @route   PUT /api/events/:id/candidates/:registrationId/status
 * @access  Private (Company)
 */
export const updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body; // checked_in, interviewed, selected, rejected
    const { id: eventId, registrationId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const registration = await EventRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Candidate registration not found' });
    }

    registration.status = status;
    await registration.save();

    // Notification type mapping
    let notificationType = 'interview_schedule';
    let notifTitle = 'Status Update';
    let notifMessage = `Your event application status for ${event.title} has been updated to ${status}.`;

    if (status === 'selected') {
      notificationType = 'selection_result';
      notifTitle = 'Congratulations! You are Selected!';
      notifMessage = `We are pleased to inform you that you have been selected at the ${event.title} hiring drive. The company will contact you shortly.`;
    } else if (status === 'rejected') {
      notificationType = 'selection_result';
      notifTitle = 'Hiring Event Update';
      notifMessage = `Thank you for participating in the ${event.title} hiring event. Unfortunately, you were not selected for this role. Keep trying!`;
    } else if (status === 'interviewed') {
      notifTitle = 'Interview Completed';
      notifMessage = `Your interview at ${event.title} has been completed. The organizing team is reviewing your profile.`;
    }

    const notification = await EventNotification.create({
      user: registration.user,
      event: eventId,
      type: notificationType,
      title: notifTitle,
      message: notifMessage,
      data: { eventId, status },
    });

    emitNotification(req, registration.user, notification);

    res.json({
      success: true,
      message: `Candidate status updated to ${status}`,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Bulk update candidate statuses and notify them
 * @route   PUT /api/events/:id/candidates/bulk-status
 * @access  Private (Company)
 */
export const bulkUpdateCandidateStatus = async (req, res) => {
  try {
    const { registrationIds, status } = req.body; // Array of registration MongoDB _ids
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Perform updates
    await EventRegistration.updateMany(
      { _id: { $in: registrationIds }, event: eventId },
      { status }
    );

    // Fetch updated registrations to send notifications
    const registrations = await EventRegistration.find({ _id: { $in: registrationIds } });

    let notificationType = 'interview_schedule';
    let notifTitle = 'Status Update';
    let notifMessage = `Your event application status for ${event.title} has been updated to ${status}.`;

    if (status === 'selected') {
      notificationType = 'selection_result';
      notifTitle = 'Congratulations! You are Selected!';
      notifMessage = `We are pleased to inform you that you have been selected at the ${event.title} hiring drive. The company will contact you shortly.`;
    } else if (status === 'rejected') {
      notificationType = 'selection_result';
      notifTitle = 'Hiring Event Update';
      notifMessage = `Thank you for participating in the ${event.title} hiring event. Unfortunately, you were not selected for this role. Keep trying!`;
    } else if (status === 'interviewed') {
      notifTitle = 'Interview Completed';
      notifMessage = `Your interview at ${event.title} has been completed. The organizing team is reviewing your profile.`;
    }

    // Send notifications in parallel
    await Promise.all(
      registrations.map(async (reg) => {
        const notif = await EventNotification.create({
          user: reg.user,
          event: eventId,
          type: notificationType,
          title: notifTitle,
          message: notifMessage,
          data: { eventId, status },
        });
        emitNotification(req, reg.user, notif);
      })
    );

    res.json({
      success: true,
      message: `Bulk updated status of ${registrations.length} candidates to ${status}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get live chat messages for a specific event
 * @route   GET /api/events/:id/chat
 * @access  Private
 */
export const getEventChat = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .select('chatMessages')
      .populate('chatMessages.sender', 'name avatar role');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({
      success: true,
      data: event.chatMessages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Send a message to live event chat
 * @route   POST /api/events/:id/chat
 * @access  Private
 */
export const sendEventChatMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const eventId = req.params.id;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const senderName = req.user.name;
    const newMessage = {
      sender: req.user._id,
      senderName,
      message: message.trim(),
      timestamp: new Date(),
    };

    event.chatMessages.push(newMessage);
    await event.save();

    // Populate sender details for real-time emit
    const populatedEvent = await Event.findById(eventId)
      .select('chatMessages')
      .populate('chatMessages.sender', 'name avatar role');
      
    const savedMessage = populatedEvent.chatMessages[populatedEvent.chatMessages.length - 1];

    // Emit live message to Socket.io event room
    const io = req.app.get('io');
    if (io) {
      io.to(`event_chat_${eventId}`).emit('newEventChatMessage', {
        eventId,
        message: savedMessage,
      });
    }

    res.json({
      success: true,
      data: savedMessage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get participation certificate details (mock layout values)
 * @route   GET /api/events/:id/certificate
 * @access  Private (Worker)
 */
export const getParticipationCertificate = async (req, res) => {
  try {
    const eventId = req.params.id;
    const workerId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const registration = await EventRegistration.findOne({ event: eventId, user: workerId });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'You are not registered for this event' });
    }

    // Verify candidate attended the event (checked_in, interviewed, selected)
    const allowedStatuses = ['checked_in', 'interviewed', 'selected'];
    if (!allowedStatuses.includes(registration.status)) {
      return res.status(400).json({
        success: false,
        message: 'Certificates are only generated for candidates who checked in and attended the event.',
      });
    }

    // Generate printable metadata
    const certificateCode = `CERT-${eventId.toString().substring(18)}-${workerId.toString().substring(18)}`.toUpperCase();
    const issueDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    res.json({
      success: true,
      data: {
        candidateName: registration.name,
        eventTitle: event.title,
        companyName: event.companyName,
        date: event.eventDate.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        issueDate,
        certificateCode,
        verified: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get event analytics details
 * @route   GET /api/events/:id/analytics
 * @access  Private (Company)
 */
export const getEventAnalytics = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const totalRegistrations = await EventRegistration.countDocuments({ event: eventId });
    
    const attendanceCount = await EventRegistration.countDocuments({
      event: eventId,
      status: { $in: ['checked_in', 'interviewed', 'selected', 'rejected'] },
    });

    const interviewedCount = await EventRegistration.countDocuments({
      event: eventId,
      status: { $in: ['interviewed', 'selected', 'rejected'] },
    });

    const selectedCount = await EventRegistration.countDocuments({
      event: eventId,
      status: 'selected',
    });

    const rejectedCount = await EventRegistration.countDocuments({
      event: eventId,
      status: 'rejected',
    });

    const attendanceRate = totalRegistrations > 0 ? Math.round((attendanceCount / totalRegistrations) * 100) : 0;
    const hiringRate = totalRegistrations > 0 ? Math.round((selectedCount / totalRegistrations) * 100) : 0;

    // Gather slot booking distributions
    const slotStats = event.slots.map((s) => ({
      time: s.time,
      booked: s.bookedCount,
      capacity: s.maxCapacity,
      fillRate: s.maxCapacity > 0 ? Math.round((s.bookedCount / s.maxCapacity) * 100) : 0,
    }));

    res.json({
      success: true,
      data: {
        totalRegistrations,
        attendanceCount,
        interviewedCount,
        selectedCount,
        rejectedCount,
        attendanceRate,
        hiringRate,
        slots: slotStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
