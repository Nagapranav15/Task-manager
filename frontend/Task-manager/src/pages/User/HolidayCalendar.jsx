import React, { useEffect, useState, useContext } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/userContext';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import { LuCalendar, LuPlus, LuTrash2, LuPencil, LuSparkles, LuPartyPopper } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import moment from 'moment';

const HolidayCalendar = () => {
  const { user } = useContext(UserContext);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('Mandatory');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_PATHS.HOLIDAYS.GET_HOLIDAYS);
      setHolidays(res.data || []);
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      toast.error('Failed to load holiday calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const openAddModal = () => {
    setEditingHolidayId(null);
    setTitle('');
    setDate('');
    setType('Mandatory');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (h) => {
    setEditingHolidayId(h._id);
    setTitle(h.title);
    setDate(h.date ? moment(h.date).format('YYYY-MM-DD') : '');
    setType(h.type || 'Mandatory');
    setDescription(h.description || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error('Title and date are required.');
      return;
    }
    try {
      setSubmitting(true);
      if (editingHolidayId) {
        await axiosInstance.put(API_PATHS.HOLIDAYS.UPDATE_HOLIDAY(editingHolidayId), {
          title,
          date,
          type,
          description,
        });
        toast.success('Holiday updated successfully!');
      } else {
        await axiosInstance.post(API_PATHS.HOLIDAYS.CREATE_HOLIDAY, {
          title,
          date,
          type,
          description,
        });
        toast.success('Holiday added successfully!');
      }
      setModalOpen(false);
      fetchHolidays();
    } catch (error) {
      console.error('Failed to save holiday:', error);
      toast.error(error.response?.data?.message || 'Failed to save holiday.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, holidayTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${holidayTitle}"?`)) return;
    try {
      await axiosInstance.delete(API_PATHS.HOLIDAYS.DELETE_HOLIDAY(id));
      toast.success('Holiday deleted successfully.');
      fetchHolidays();
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      toast.error('Failed to delete holiday.');
    }
  };

  return (
    <DashboardLayout activeMenu="holiday-calendar">
      <div className="mt-4 mb-10 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-widest flex items-center gap-1.5">
              <LuPartyPopper className="text-amber-500" /> Public Holidays
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide mt-1">
              Official Holiday Calendar
            </h2>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              <LuPlus className="text-base" />
              <span>Add Public Holiday</span>
            </button>
          )}
        </div>

        {/* Holidays List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {holidays.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 text-xs font-semibold">
              No public holidays scheduled yet.
            </div>
          ) : (
            holidays.map((item) => {
              const formattedDate = moment(item.date).format('DD MMM YYYY');
              const dayName = item.dayOfWeek || moment(item.date).format('dddd');
              const isMandatory = item.type === 'Mandatory';

              return (
                <div
                  key={item._id}
                  className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1">
                        <LuCalendar className="text-xs" /> {dayName}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          isMandatory
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-800 dark:text-slate-100">
                      {item.title}
                    </h4>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      📅 {formattedDate}
                    </p>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {user?.role === 'admin' && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Holiday"
                      >
                        <LuPencil className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.title)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete Holiday"
                      >
                        <LuTrash2 className="text-sm" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                {editingHolidayId ? 'Edit Public Holiday' : 'Add Public Holiday'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Holiday Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Independence Day, New Year's Day..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white dark:[color-scheme:dark] rounded-xl px-3 py-2 text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Holiday Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs outline-none"
                  >
                    <option value="Mandatory">Mandatory</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl p-3 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md cursor-pointer"
                >
                  {editingHolidayId ? 'Update Holiday' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default HolidayCalendar;
